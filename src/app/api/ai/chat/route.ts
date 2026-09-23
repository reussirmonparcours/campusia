import { createClient } from "@/lib/supabase/server";
import { buildAIContext } from "@/lib/ai/context";
import { AIRequest, AIRequestSchema, AIResponse } from "@/types/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, message, currentState } = body;

    if (!sessionId || !message) {
      return new Response("Missing parameters", { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Session Ownership
    const { data: session, error: sessionError } = await supabase
      .from("ai_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return new Response("Not found", { status: 404 });
    }

    // Idempotence check
    const { data: lastMessage } = await supabase
      .from("ai_messages")
      .select("created_at")
      .eq("session_id", sessionId)
      .eq("role", "user")
      .eq("content", message)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastMessage) {
      const now = new Date();
      const lastTime = new Date(lastMessage.created_at);
      if (now.getTime() - lastTime.getTime() < 10000) {
        return new Response("Idempotent conflict", { status: 409 });
      }
    }

    // Persist User Message
    const { error: userMsgError } = await supabase
      .from("ai_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: message,
      });

    if (userMsgError) {
      return new Response("Internal Server Error", { status: 500 });
    }

    // Build Context
    const aiContext = await buildAIContext(session.subject_id ?? undefined, undefined, sessionId, message);

    const rawRequest: AIRequest = {
      mode: session.mode,
      studentContext: aiContext.studentContext,
      academicContext: aiContext.academicContext,
      learningContext: aiContext.learningContext,
      learnerMemories: aiContext.learnerMemories,
      summary: aiContext.summary,
      recentHistory: aiContext.recentHistory,
      currentContext: currentState,
      userMessage: message,
    };

    const validatedRequest = AIRequestSchema.parse(rawRequest);

    const { Retriever } = await import("@/lib/rag/retriever");
    const { ContextBuilder } = await import("@/lib/rag/context-builder");
    const { OpenAIProvider } = await import("@/lib/ai/openai-provider");
    const { OpenAIEmbeddingProvider } = await import("@/lib/rag/embeddings/openai-provider");

    const embeddingProvider = new OpenAIEmbeddingProvider();
    const retriever = new Retriever(supabase, embeddingProvider);
    const ragContextBuilder = new ContextBuilder(retriever);
    
    // eslint-disable-next-line prefer-const
    let finalRequest = validatedRequest as AIRequest;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
      const ragContext = await ragContextBuilder.buildContext(finalRequest, user.id);
      finalRequest.sourceContext = ragContext.safeSources;
      finalRequest._internalMapping = ragContext.internalMapping;
    } catch (e: any) {
      if (e.name === "RagError") {
        const fallbackResponse = JSON.stringify({
          message: e.message,
          mode: finalRequest.mode,
          generatedBy: "AI",
          sourceProvenance: [],
          warnings: [e.code || "RAG_ERROR"]
        });
        
        // DO NOT persist in ai_messages
        
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: ${fallbackResponse}\n\n`));
            controller.close();
          }
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      }
      throw e;
    }

    const provider = new OpenAIProvider();
    
    const stream = new ReadableStream({
      async start(controller) {
        let finalAIResponse: AIResponse | null = null;
        try {
          const aiStream = provider.stream(finalRequest, req.signal);
          for await (const chunk of aiStream) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
            if (chunk.sourceProvenance !== undefined) {
              finalAIResponse = chunk as AIResponse;
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("Stream error", err);
          controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`));
        } finally {
          controller.close();
          
          if (finalAIResponse) {
             await supabase.from("ai_messages").insert({
               session_id: sessionId,
               role: "assistant",
               content: finalAIResponse.message,
               sources_used: finalAIResponse.sourceProvenance.length > 0 ? finalAIResponse.sourceProvenance : null,
             });
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("API Chat Error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

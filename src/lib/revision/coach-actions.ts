"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { buildRevisionCoachContext, mapRevisionContextToProviderSources } from "./coach-context";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import { buildAIContext } from "@/lib/ai/context";
import { AIRequest, AIResponse } from "@/types/ai";

const SendMessageSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  userMessage: z.string().min(1).max(2000),
});

export async function getCoachHistory(attemptId: string, questionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  // 1. Ownership & Pedagogy Check
  const { data: attemptData, error: attemptError } = await supabase
    .from("learning_attempts")
    .select(`
      id,
      user_id,
      exercise_id,
      learning_exercises!inner (
        id,
        subject_id,
        learning_questions!inner (id)
      )
    `)
    .eq("id", attemptId)
    .single();

  if (attemptError || !attemptData || attemptData.user_id !== user.id) {
    return { error: "Tentative introuvable ou accès refusé" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exercise = attemptData.learning_exercises as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const question = exercise.learning_questions.find((q: any) => q.id === questionId);

  if (!question) {
    return { error: "Question invalide pour cet exercice" };
  }

  // 2. Fetch Session
  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mode", "coach")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .single();

  if (sessionError || !session) {
    return { success: true, sessionId: null, messages: [] };
  }

  // 3. Fetch Messages
  const { data: messages, error: messagesError } = await supabase
    .from("ai_messages")
    .select("id, role, content, sources_used, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return { error: "Erreur lors de la récupération des messages" };
  }

  return {
    success: true,
    sessionId: session.id,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      generatedBy: m.role === "assistant" ? "AI" : undefined
    }))
  };
}

export async function sendRevisionCoachMessage(
  attemptId: string,
  questionId: string,
  userMessage: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  const parsed = SendMessageSchema.safeParse({ attemptId, questionId, userMessage });
  if (!parsed.success) {
    return { error: "Paramètres invalides" };
  }

  const { attemptId: aId, questionId: qId, userMessage: msg } = parsed.data;

  // 1. Verify Attempt & Question Integrity (Server as Source of Truth)
  const { data: attemptData, error: attemptError } = await supabase
    .from("learning_attempts")
    .select(`
      id,
      user_id,
      learning_answers ( question_id, choice_id, free_text_answer ),
      learning_exercises!inner (
        id,
        title,
        subject_id,
        learning_questions!inner (
          id,
          content,
          explanation,
          question_type,
          learning_choices ( id, content, explanation, learning_choice_corrections ( is_correct ) )
        )
      )
    `)
    .eq("id", aId)
    .single();

  if (attemptError || !attemptData || attemptData.user_id !== user.id) {
    return { error: "Tentative introuvable ou accès refusé" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exercise = attemptData.learning_exercises as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const question = exercise.learning_questions.find((q: any) => q.id === qId);

  if (!question) {
    return { error: "Question invalide pour cet exercice" };
  }

  // 2. Session Management (Deterministic & Concurrent-safe)
  let activeSessionId: string | undefined;

  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mode", "coach")
    .eq("attempt_id", aId)
    .eq("question_id", qId)
    .single();

  if (session && !sessionError) {
    activeSessionId = session.id;
  } else {
    // Attempt creation
    const { data: newSession, error: createError } = await supabase
      .from("ai_sessions")
      .insert({
        user_id: user.id,
        mode: "coach",
        subject_id: exercise.subject_id,
        attempt_id: aId,
        question_id: qId
      })
      .select("id")
      .single();

    if (createError) {
      // Possible race condition: duplicate key violation. Try fetching again.
      if (createError.code === "23505") {
         const { data: retrySession } = await supabase
          .from("ai_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("mode", "coach")
          .eq("attempt_id", aId)
          .eq("question_id", qId)
          .single();
         
         if (retrySession) {
           activeSessionId = retrySession.id;
         } else {
           return { error: "Erreur de concurrence session coach" };
         }
      } else {
        return { error: "Erreur lors de la création de la session" };
      }
    } else if (newSession) {
      activeSessionId = newSession.id;
    }
  }

  if (!activeSessionId) {
    return { error: "Impossible de déterminer la session" };
  }

  // 3. Persist User Message
  const { error: userMsgError } = await supabase
    .from("ai_messages")
    .insert({
      session_id: activeSessionId,
      role: "user",
      content: msg,
    });

  if (userMsgError) {
    return { error: "Erreur de sauvegarde du message" };
  }

  // 4. Build Context (Phase 4)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answerData = attemptData.learning_answers?.find((a: any) => a.question_id === qId);
  const internalData = {
    exercise: { title: exercise.title },
    question: {
      content: question.content,
      type: question.question_type,
      explanation: question.explanation,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      choices: question.learning_choices?.map((c: any) => ({
        id: c.id,
        content: c.content,
        is_correct: c.learning_choice_corrections?.is_correct,
        explanation: c.explanation,
      })) || []
    },
    answer: answerData
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coachContext = buildRevisionCoachContext(internalData as any);
  const sourceContext = mapRevisionContextToProviderSources(coachContext);

  // 5. Send to MockAIProvider
  const provider = new OpenAIProvider();
  const aiContext = await buildAIContext(exercise.subject_id);
  
  const aiRequest: AIRequest = {
    mode: "coach",
    userMessage: msg,
    sourceContext,
    studentContext: aiContext.studentContext,
    academicContext: aiContext.academicContext,
  };

  let aiResponse: AIResponse;
  try {
    aiResponse = await provider.generate(aiRequest);
  } catch (error) {
    console.error("AI Error:", error);
    return { error: "Erreur du fournisseur d'IA" };
  }

  // 6. Persist AI Response
  const { error: aiMsgError } = await supabase
    .from("ai_messages")
    .insert({
      session_id: activeSessionId,
      role: "assistant",
      content: aiResponse.message,
      sources_used: aiResponse.sourceProvenance.length > 0 ? aiResponse.sourceProvenance : null,
    });

  if (aiMsgError) {
    return { error: "Erreur de sauvegarde de la réponse IA" };
  }

  return {
    success: true,
    sessionId: activeSessionId,
    message: aiResponse.message,
    generatedBy: aiResponse.generatedBy
  };
}

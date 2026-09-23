"use server";

import { createClient } from "@/lib/supabase/server";
import { AIMode, AIRequest, AICurrentState, AIResponse, AIError, AIProvider, AIRequestSchema, AIResponseSchema } from "@/types/ai";

/**
 * Creates a new AI Session
 */
export async function createAISession(mode: AIMode, subjectId?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("ai_sessions")
    .insert({
      user_id: user.id,
      mode,
      subject_id: subjectId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create AI session", error);
    throw new Error("Failed to create AI session");
  }

  return data;
}

/**
 * Retrieves the message history for a session
 */
export async function getSessionMessages(sessionId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Unauthorized");

  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Session not found or access denied");
  }
  
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to retrieve messages", error);
    throw new Error("Failed to retrieve messages");
  }

  return data;
}

// sendChatMessage removed in Phase 4. Replaced by /api/ai/chat/route.ts endpoint.

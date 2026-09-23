"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  CreateExamInput, createExamSchema,
  StartExamInput, startExamSchema,
  SubmitExamAnswerInput, submitExamAnswerSchema,
  FinishExamInput, finishExamSchema,
  ExamSession
} from "@/types/exam";
import { submitAnswer, completeAttempt } from "@/lib/learning/actions";

export async function createExam(input: CreateExamInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = createExamSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides", details: result.error.flatten() };

  const { exerciseId, durationMinutes, questionCount } = result.data;

  // 1. Verify exercise exists and is accessible
  const { data: exercise, error: fetchError } = await supabase
    .from("learning_exercises")
    .select("id, subject_id")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !exercise) {
    return { error: "Exercice introuvable ou accès refusé" };
  }

  // 2. Start a transaction by doing sequential inserts (Supabase JS doesn't have true transactions without RPC, 
  // but we can simulate or we could write an RPC. For MVP we do it sequentially, deleting on fail if needed).
  
  // 2a. Create exam session
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      learning_exercise_id: exerciseId,
      duration_minutes: durationMinutes,
      status: "planned"
    })
    .select()
    .single();

  if (sessionError || !session) return { error: "Erreur lors de la création de la session" };

  // 2b. Fetch questions to freeze them
  const { data: allQuestions, error: qError } = await supabase
    .from("learning_questions")
    .select("id")
    .eq("exercise_id", exerciseId);

  if (qError || !allQuestions || allQuestions.length === 0) {
    // Rollback session
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return { error: "Aucune question trouvée pour cet exercice" };
  }

  // Optional: Shuffle and slice if questionCount is provided
  let selectedQuestions = [...allQuestions];
  if (questionCount && questionCount < selectedQuestions.length) {
    selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);
  }

  const examQuestions = selectedQuestions.map((q, index) => ({
    exam_session_id: session.id,
    learning_question_id: q.id,
    order_index: index
  }));

  const { error: eqError } = await supabase.from("exam_questions").insert(examQuestions);
  if (eqError) {
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return { error: "Erreur lors de l'enregistrement des questions" };
  }

  // 2c. Create the underlying learning attempt in M04
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .insert({
      user_id: user.id,
      exercise_id: exerciseId,
      status: "started"
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return { error: "Erreur lors de l'initialisation de la tentative" };
  }

  // 2d. Link attempt to session
  const { error: linkError } = await supabase
    .from("exam_attempts")
    .insert({
      exam_session_id: session.id,
      learning_attempt_id: attempt.id
    });

  if (linkError) {
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    await supabase.from("learning_attempts").delete().eq("id", attempt.id);
    return { error: "Erreur de liaison de l'examen" };
  }

  revalidatePath("/dashboard/exams");
  return { success: true, data: session as ExamSession };
}

export async function startExam(input: StartExamInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = startExamSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides" };

  const { sessionId } = result.data;

  // Verify session belongs to user and is planned
  const { data: session, error: sError } = await supabase
    .from("exam_sessions")
    .select("status, duration_minutes")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sError || !session) return { error: "Session introuvable" };
  if (session.status !== "planned") return { error: "La session n'est pas à l'état planifié" };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + session.duration_minutes * 60000);

  const { data: updatedSession, error: updateError } = await supabase
    .from("exam_sessions")
    .update({
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .eq("id", sessionId)
    .eq("status", "planned")
    .select()
    .single();

  if (updateError) return { error: "Erreur de démarrage de l'examen" };

  revalidatePath(`/dashboard/exams/${sessionId}`);
  return { success: true, data: updatedSession as ExamSession };
}

export async function submitExamAnswer(input: SubmitExamAnswerInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = submitExamAnswerSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides" };

  const { sessionId, questionId, choiceId, freeTextAnswer } = result.data;

  // 1. Fetch Session and Check Expiration
  const { data: session, error: sError } = await supabase
    .from("exam_sessions")
    .select("status, expires_at, exam_attempts(learning_attempt_id)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sError || !session) return { error: "Session introuvable" };
  if (session.status !== "active") return { error: "L'examen n'est pas actif" };

  const now = new Date();
  const expiresAt = new Date(session.expires_at!);

  // Strict expiration check (no arbitrary grace period)
  if (now.getTime() > expiresAt.getTime()) {
    return { error: "Le temps imparti pour cet examen est écoulé", expired: true };
  }

  // 2. Fetch the linked learning attempt
  const learningAttemptId = session.exam_attempts?.[0]?.learning_attempt_id;
  if (!learningAttemptId) return { error: "Tentative liée introuvable" };

  // 3. Delegate to M04 submitAnswer
  const m04Result = await submitAnswer({
    attemptId: learningAttemptId,
    questionId: questionId,
    choiceId: choiceId,
    freeTextAnswer: freeTextAnswer
  });

  if (m04Result.error) {
    return { error: m04Result.error };
  }

  // Security: Never leak is_correct during an active exam
  return { 
    success: true, 
    savedAt: new Date().toISOString()
  };
}

export async function finishExam(input: FinishExamInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = finishExamSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides" };

  const { sessionId } = result.data;

  // 1. Verify session
  const { data: session, error: sError } = await supabase
    .from("exam_sessions")
    .select("status, expires_at, exam_attempts(learning_attempt_id)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sError || !session) return { error: "Session introuvable" };
  
  if (session.status !== "active") {
    return { error: "Examen non actif ou déjà terminé" };
  }

  const learningAttemptId = session.exam_attempts?.[0]?.learning_attempt_id;
  if (!learningAttemptId) return { error: "Tentative liée introuvable" };

  const now = new Date();
  const expiresAt = new Date(session.expires_at!);
  const isExpired = now.getTime() > expiresAt.getTime();
  const finalStatus = isExpired ? "expired" : "submitted";

  // 2. Atomic Transition
  const { data: updated, error: updateError } = await supabase
    .from("exam_sessions")
    .update({
      status: finalStatus,
      completed_at: now.toISOString()
    })
    .eq("id", sessionId)
    .eq("status", "active")
    .select()
    .single();

  if (updateError || !updated) {
    return { error: "Erreur de concurrence ou examen déjà terminé" };
  }

  // 3. Score via M04
  const completeResult = await completeAttempt({ attemptId: learningAttemptId });
  if (completeResult.error) {
    // Note: session is marked completed in M08 but failed in M04. Manual fix needed.
    return { error: completeResult.error };
  }

  revalidatePath(`/dashboard/exams/${sessionId}`);
  return { success: true, score: completeResult.score, max_score: completeResult.max_score };
}

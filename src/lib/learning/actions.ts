"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/student/actions";
import { 
  StartAttemptInput, 
  startAttemptSchema, 
  SubmitAnswerInput, 
  submitAnswerSchema, 
  CompleteAttemptInput, 
  completeAttemptSchema,
  LearningAttempt,
  LearningAnswer
} from "@/types/learning";

/**
 * Starts a learning attempt for a given exercise
 */
export async function startAttempt(input: StartAttemptInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = startAttemptSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides", details: result.error.flatten() };

  const { exerciseId } = result.data;

  // Check if exercise exists and is accessible (RLS will handle access, but we do a select)
  const { data: exercise, error: fetchError } = await supabase
    .from("learning_exercises")
    .select("id")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !exercise) {
    return { error: "Exercice introuvable ou accès refusé" };
  }

  // Create attempt
  const { data: attempt, error: insertError } = await supabase
    .from("learning_attempts")
    .insert({
      user_id: user.id,
      exercise_id: exerciseId,
      status: "started",
    })
    .select()
    .single();

  if (insertError || !attempt) {
    console.error("Failed to start attempt:", insertError);
    return { error: "Impossible de démarrer la tentative" };
  }

  revalidatePath("/dashboard/learning");
  return { data: attempt as LearningAttempt };
}

/**
 * Submits an answer to a question in a given attempt.
 * Securely evaluates correctness on the server.
 */
export async function submitAnswer(input: SubmitAnswerInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = submitAnswerSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides", details: result.error.flatten() };

  const { attemptId, questionId, choiceId, freeTextAnswer } = result.data;

  // Verify attempt belongs to user and is started
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .select("id, status, exercise_id")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt || attempt.status !== "started") {
    return { error: "Tentative invalide ou déjà terminée" };
  }

  // Verify question exists
  const { data: question, error: qError } = await supabase
    .from("learning_questions")
    .select("question_type, exercise_id")
    .eq("id", questionId)
    .single();

  if (qError || !question) return { error: "Question introuvable" };

  if (question.exercise_id !== attempt.exercise_id) {
    return { error: "La question n'appartient pas à l'exercice de la tentative" };
  }

  let isCorrect: boolean | null = null;

  if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
    if (!choiceId) return { error: "Une option doit être sélectionnée" };
    // Check if the choice is correct
    const supabaseAdmin = createAdminClient();
    const { data: correction, error: cError } = await supabaseAdmin
      .from("learning_choice_corrections")
      .select("is_correct")
      .eq("choice_id", choiceId)
      .single();
    
    if (cError || !correction) return { error: "Option invalide" };
    isCorrect = correction.is_correct;
  } else if (question.question_type === "free_text") {
    // Free text is stored but not automatically evaluated
    isCorrect = null;
  }

  // Upsert the answer
  const { data: answer, error: upsertError } = await supabase
    .from("learning_answers")
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        choice_id: choiceId || null,
        free_text_answer: freeTextAnswer || null,
        is_correct: isCorrect,
        submitted_at: new Date().toISOString()
      },
      { onConflict: "attempt_id, question_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("Failed to submit answer:", upsertError);
    return { error: "Impossible d'enregistrer la réponse" };
  }

  return { success: true, data: answer as LearningAnswer };
}

/**
 * Completes an attempt, calculates the final score, and logs the activity in M03
 */
export async function completeAttempt(input: CompleteAttemptInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const result = completeAttemptSchema.safeParse(input);
  if (!result.success) return { error: "Données invalides", details: result.error.flatten() };

  const { attemptId } = result.data;

  // 1. Fetch attempt and exercise
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .select(`
      id, status, exercise_id,
      learning_exercises ( title, subject_id )
    `)
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) return { error: "Tentative introuvable" };
  if (attempt.status !== "started") return { error: "La tentative n'est plus en cours" };

  // 2. Fetch all answers for this attempt
  const { data: answers, error: answersError } = await supabase
    .from("learning_answers")
    .select("is_correct")
    .eq("attempt_id", attemptId);

  if (answersError) return { error: "Impossible de récupérer les réponses" };

  // 3. Fetch total questions to calculate max_score
  const { count: totalQuestions, error: countError } = await supabase
    .from("learning_questions")
    .select("*", { count: 'exact', head: true })
    .eq("exercise_id", attempt.exercise_id);

  if (countError || totalQuestions === null) return { error: "Erreur de calcul du score" };

  // Calculate score (only automatically evaluable questions count towards the score)
  let score = 0;
  for (const a of answers) {
    if (a.is_correct === true) score++;
  }

  // max_score should be the number of evaluable questions.
  const { count: evaluableQuestions, error: evalCountError } = await supabase
    .from("learning_questions")
    .select("*", { count: 'exact', head: true })
    .eq("exercise_id", attempt.exercise_id)
    .neq("question_type", "free_text");
    
  const finalMaxScore = (evalCountError || evaluableQuestions === null) ? totalQuestions : evaluableQuestions;

  // 4. Complete the attempt
  const { error: updateError } = await supabase
    .from("learning_attempts")
    .update({
      status: "completed",
      score,
      max_score: finalMaxScore,
      completed_at: new Date().toISOString()
    })
    .eq("id", attemptId);

  if (updateError) return { error: "Impossible de clôturer la tentative" };

  // 5. Log activity in M03
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exercise = attempt.learning_exercises as any;
  await logActivity(
    "learning_completed",
    `A terminé l'exercice : ${exercise.title}`,
    "manual",
    exercise.subject_id,
    { attempt_id: attemptId, score, max_score: finalMaxScore }
  );

  revalidatePath(`/dashboard/learning/${attempt.exercise_id}`);
  return { success: true, score, max_score: finalMaxScore };
}

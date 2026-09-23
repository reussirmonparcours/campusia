"use server";

import { createClient } from "@/lib/supabase/server";

import { SupabaseClient, User } from "@supabase/supabase-js";

// Pure logic functions for testability
export async function createRevisionSessionLogic(
  supabase: SupabaseClient,
  user: User,
  subjectId: string,
  learningExerciseId: string
) {
  // 1. Validate subject ownership or visibility (M02 rules)
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("created_by")
    .eq("id", subjectId)
    .single();

  if (subjectError || !subject) {
    throw new Error("Subject not found");
  }

  if (subject.created_by !== null && subject.created_by !== user.id) {
    throw new Error("Access denied to subject");
  }

  // 2. Validate exercise ownership and subject linkage
  const { data: exercise, error: exerciseError } = await supabase
    .from("learning_exercises")
    .select("subject_id, created_by")
    .eq("id", learningExerciseId)
    .single();

  if (exerciseError || !exercise) {
    throw new Error("Exercise not found");
  }

  if (exercise.subject_id !== subjectId) {
    throw new Error("Exercise does not belong to the specified subject");
  }

  if (exercise.created_by !== null && exercise.created_by !== user.id) {
    throw new Error("Access denied to exercise");
  }

  // 3. Create session
  const { data, error } = await supabase
    .from("revision_sessions")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      learning_exercise_id: learningExerciseId,
      status: "planned",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create revision session", error);
    throw new Error("Failed to create revision session");
  }

  return data;
}

export async function createRevisionAttemptLogic(
  supabase: SupabaseClient,
  user: User,
  revisionSessionId: string,
  learningAttemptId: string
) {
  // 1. Verify revision session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("revision_sessions")
    .select("user_id, learning_exercise_id")
    .eq("id", revisionSessionId)
    .single();

  if (sessionError || !session || session.user_id !== user.id) {
    throw new Error("Revision session not found or access denied");
  }

  // 2. Verify learning attempt belongs to user and matches exercise
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .select("user_id, exercise_id")
    .eq("id", learningAttemptId)
    .single();

  if (attemptError || !attempt || attempt.user_id !== user.id) {
    throw new Error("Learning attempt not found or access denied");
  }

  if (attempt.exercise_id !== session.learning_exercise_id) {
    throw new Error("Learning attempt exercise does not match revision session exercise");
  }

  // 3. Create revision attempt link
  const { data, error } = await supabase
    .from("revision_attempts")
    .insert({
      revision_session_id: revisionSessionId,
      learning_attempt_id: learningAttemptId,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create revision attempt link", error);
    throw new Error("Failed to create revision attempt link");
  }

  return data;
}

export async function createRevisionSession(subjectId: string, learningExerciseId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");
  return createRevisionSessionLogic(supabase, user, subjectId, learningExerciseId);
}

export async function createRevisionAttempt(revisionSessionId: string, learningAttemptId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");
  return createRevisionAttemptLogic(supabase, user, revisionSessionId, learningAttemptId);
}

// -----------------------------------------------------------------------------
// UI Integration Actions (Phase 3)
// -----------------------------------------------------------------------------

import { getPriorityExercisesForSubjectLogic } from "./priority";
import { startAttempt } from "@/lib/learning/actions"; // M04 integration

export type RevisionContext = {
  attemptId?: string;
};

export async function findOrCreateRevisionSession(subjectId: string, context?: RevisionContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };
  
  try {
    // 1. Check for existing active session
    const { data: existingSession, error: existingError } = await supabase
      .from("revision_sessions")
      .select(`
        id, 
        learning_exercise_id,
        learning_exercises ( subject_id, created_by )
      `)
      .eq("user_id", user.id)
      .eq("subject_id", subjectId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession && !existingError) {
      // 1.b Verify coherence: exercise still belongs to subject and is accessible
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ex = existingSession.learning_exercises as any;
      if (ex && ex.subject_id === subjectId && (ex.created_by === null || ex.created_by === user.id)) {
        return { data: { id: existingSession.id, learning_exercise_id: existingSession.learning_exercise_id } };
      }
      
      // Incohérence (l'exercice a été déplacé, supprimé ou droits perdus)
      // Comportement déterministe : on abandonne cette session invalide et on en recrée une.
      await supabase
        .from("revision_sessions")
        .update({ status: 'abandoned' })
        .eq("id", existingSession.id);
    }

    // 2. Process context or fetch priority
    let selectedExerciseId: string | null = null;
    
    // Si un contexte d'examen est fourni, on vérifie d'abord sa validité (sécurité M06)
    if (context?.attemptId) {
      const { data: attempt, error: attemptError } = await supabase
        .from("learning_attempts")
        .select(`
          id, 
          status, 
          user_id,
          exercise_id,
          learning_exercises ( subject_id )
        `)
        .eq("id", context.attemptId)
        .single();
        
      if (!attemptError && attempt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attemptEx = attempt.learning_exercises as any;
        // Vérifications de sécurité absolues :
        // 1. L'attempt appartient à l'utilisateur
        // 2. L'attempt est terminé
        // 3. L'exercice correspond bien à la matière demandée
        if (
          attempt.user_id === user.id && 
          attempt.status === "completed" && 
          attemptEx?.subject_id === subjectId
        ) {
          selectedExerciseId = attempt.exercise_id;
        }
      }
    }
    
    // Fallback: utilisation de la logique de priorité M06 classique
    if (!selectedExerciseId) {
      const priorityExercises = await getPriorityExercisesForSubjectLogic(supabase, user, subjectId);
      
      if (!priorityExercises || priorityExercises.length === 0) {
        return { error: "Aucun exercice disponible pour cette matière" };
      }
      
      // Pick top priority
      selectedExerciseId = priorityExercises[0].exerciseId;
    }
    
    // 3. Create session
    const { data: newSession, error: createError } = await supabase
      .from("revision_sessions")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        learning_exercise_id: selectedExerciseId,
        status: "active"
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating revision session", createError);
      return { error: "Impossible de créer la session de révision" };
    }

    return { data: newSession };
  } catch (error) {
    console.error("findOrCreateRevisionSession failed", error);
    return { error: "Erreur inattendue" };
  }
}

export async function startRevisionAttemptAction(revisionSessionId: string, exerciseId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  try {
    // 1. Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from("revision_sessions")
      .select("status, user_id, learning_exercise_id")
      .eq("id", revisionSessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return { error: "Session introuvable ou accès refusé" };
    }
    
    if (session.learning_exercise_id !== exerciseId) {
      return { error: "Incohérence d'exercice" };
    }

    if (session.status === "completed" || session.status === "abandoned") {
      return { error: "Cette session est déjà terminée" };
    }

    // 2. Use M04 to start attempt
    const attemptResult = await startAttempt({ exerciseId });
    if (attemptResult.error || !attemptResult.data) {
      return { error: attemptResult.error || "Impossible de démarrer l'exercice" };
    }
    
    const attemptId = attemptResult.data.id;

    // 3. Link via M06 revision_attempts
    const linkResult = await createRevisionAttemptLogic(supabase, user, revisionSessionId, attemptId);
    
    return { data: { attemptId, linkId: linkResult.id } };
  } catch (error) {
    console.error("startRevisionAttemptAction failed", error);
    return { error: "Erreur inattendue" };
  }
}

export async function closeRevisionSession(revisionSessionId: string, status: 'completed' | 'abandoned') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  try {
    if (status !== 'completed' && status !== 'abandoned') {
      return { error: "Statut invalide" };
    }

    const { data, error } = await supabase
      .from("revision_sessions")
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq("id", revisionSessionId)
      .eq("user_id", user.id)
      .eq("status", "active") // Enforcement strict: la session doit être active
      .select()
      .single();
      
    if (error || !data) return { error: "Impossible de clore la session ou transition interdite" };
    return { data };
  } catch {
    return { error: "Erreur inattendue" };
  }
}

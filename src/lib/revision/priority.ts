import { SupabaseClient, User } from "@supabase/supabase-js";

export interface PriorityReason {
  type: 'recent_error' | 'old_error' | 'recent_abandon' | 'old_abandon' | 'never_reviewed';
  description: string;
}

export interface PriorityResult {
  exerciseId: string;
  score: number;
  reasons: PriorityReason[];
  relevantEventCreatedAt: string | null;
}

// Pure calculation logic for testability
export function calculateRevisionPriority(
  exercises: { id: string }[],
  attempts: { exercise_id: string, score: number | null, max_score: number | null, status: string, created_at: string }[],
  nowDate: Date = new Date()
): PriorityResult[] {
  const threeDaysAgoMs = nowDate.getTime() - 3 * 24 * 60 * 60 * 1000;
  
  const results = exercises.map(exercise => {
    const exerciseAttempts = attempts.filter(a => a.exercise_id === exercise.id);
    
    let totalScore = 0;
    const reasons: PriorityReason[] = [];
    let latestRelevantEventDate: string | null = null;
    let hasError = false;
    let hasAbandon = false;
    
    if (exerciseAttempts.length === 0) {
      return {
        exerciseId: exercise.id,
        score: 2,
        reasons: [{ type: 'never_reviewed', description: 'Jamais travaillé' } as PriorityReason],
        relevantEventCreatedAt: null
      };
    }
    
    for (const attempt of exerciseAttempts) {
      const isError = attempt.score !== null && attempt.max_score !== null && attempt.score < attempt.max_score;
      const isAbandon = attempt.status === 'abandoned';
      
      if (!isError && !isAbandon) continue;
      
      const attemptDate = new Date(attempt.created_at);
      const isRecent = attemptDate.getTime() >= threeDaysAgoMs;
      
      // Update relevant event date
      if (!latestRelevantEventDate || attemptDate.getTime() > new Date(latestRelevantEventDate).getTime()) {
        latestRelevantEventDate = attempt.created_at;
      }
      
      if (isError) {
        hasError = true;
        const points = isRecent ? 15 : 10;
        totalScore += points;
        reasons.push({ 
          type: isRecent ? 'recent_error' : 'old_error', 
          description: isRecent ? 'Erreur récente' : 'Erreur ancienne' 
        });
      }
      
      if (isAbandon) {
        hasAbandon = true;
        const points = isRecent ? 7.5 : 5;
        totalScore += points;
        reasons.push({ 
          type: isRecent ? 'recent_abandon' : 'old_abandon', 
          description: isRecent ? 'Abandon récent' : 'Abandon ancien' 
        });
      }
    }

    // Deduplicate simple reasons for concise UI
    const conciseReasons: PriorityReason[] = [];
    if (hasError) conciseReasons.push({ type: 'old_error', description: 'Erreurs détectées' });
    if (hasAbandon) conciseReasons.push({ type: 'old_abandon', description: 'Exercice abandonné' });
    
    return {
      exerciseId: exercise.id,
      score: totalScore,
      reasons: reasons.length > 0 ? reasons : [], // Or use conciseReasons based on UI needs. We keep all for detail.
      relevantEventCreatedAt: latestRelevantEventDate
    };
  });
  
  // Sort deterministically
  return results.sort((a, b) => {
    // 1. priority_score DESC
    if (b.score !== a.score) return b.score - a.score;
    
    // 2. relevant_event_created_at DESC NULLS LAST
    if (a.relevantEventCreatedAt && b.relevantEventCreatedAt) {
      const timeA = new Date(a.relevantEventCreatedAt).getTime();
      const timeB = new Date(b.relevantEventCreatedAt).getTime();
      if (timeA !== timeB) return timeB - timeA;
    } else if (a.relevantEventCreatedAt && !b.relevantEventCreatedAt) {
      return -1; // a before b
    } else if (!a.relevantEventCreatedAt && b.relevantEventCreatedAt) {
      return 1; // b before a
    }
    
    // 3. learning_exercise_id ASC
    return a.exerciseId.localeCompare(b.exerciseId);
  });
}

// Server action logic
export async function getPriorityExercisesForSubjectLogic(
  supabase: SupabaseClient,
  user: User,
  subjectId: string,
  nowDate: Date = new Date()
) {
  // Strategy: In-memory aggregation of bounded DB query.
  // We only fetch exercises for this specific subject (RLS ensures we only see accessible ones).
  // We only fetch attempts for these exercises for the current user in the last 30 days.
  // This avoids complex RPCs, uses pure SQL RLS, and is highly performant given the strict bounding.

  const thirtyDaysAgo = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // 1. Get accessible exercises for the subject
  const { data: exercises, error: exercisesError } = await supabase
    .from('learning_exercises')
    .select('id')
    .eq('subject_id', subjectId);
    
  if (exercisesError) {
    throw new Error('Failed to fetch exercises');
  }
  
  if (!exercises || exercises.length === 0) {
    return [];
  }
  
  const exerciseIds = exercises.map(e => e.id);
  
  // 2. Get attempts for these exercises in last 30 days for this user
  const { data: attempts, error: attemptsError } = await supabase
    .from('learning_attempts')
    .select('exercise_id, score, max_score, status, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo)
    .in('exercise_id', exerciseIds);
    
  if (attemptsError) {
    throw new Error('Failed to fetch attempts');
  }
  
  // 3. Calculate and sort
  return calculateRevisionPriority(exercises, attempts || [], nowDate);
}

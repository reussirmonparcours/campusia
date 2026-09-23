import { createClient } from "@/lib/supabase/server";
import { 
  AIStudentContext, 
  AIAcademicContext, 
  AILearningContextSummary 
} from "@/types/ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { MemoryRepository } from "./memory/repository";

/**
 * Builds the AI context deterministically and securely.
 * Enforces privacy (no PII), filters by subject (subject security), 
 * bounds output arrays to max 5 items.
 *
 * Rules:
 * M03 (Activities): subject relevance -> recency -> max 5
 * M04 (Attempts): subject relevance -> pedagogical relevance (errors/abandoned first) -> recency -> max 5
 */
export async function buildAIContext(
  subjectId?: string, 
  injectedClient?: SupabaseClient,
  sessionId?: string,
  currentUserMessage?: string
) {
  const supabase = injectedClient ?? await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  // ==========================================================================
  // 1. STUDENT CONTEXT (PII Protected)
  // ==========================================================================
  
  // Notice we purposefully DO NOT select first_name, last_name, display_name.
  // The backend ensures PII cannot leak into the LLM payload.
  const { data: profile } = await supabase
    .from("student_profiles")
    .select(`
      custom_program,
      custom_level,
      programs ( name, cycle ),
      tracks ( name ),
      semesters ( semester_number )
    `)
    .eq("user_id", userId)
    .single();

  let semester: string | undefined = undefined;
  let program: string | undefined = undefined;
  let level: string | undefined = undefined;

  if (profile) {
    if (profile.semesters && typeof profile.semesters === "object" && "semester_number" in profile.semesters) {
      semester = `Semestre ${(profile.semesters as Record<string, unknown>).semester_number}`;
    }

    if (profile.programs && typeof profile.programs === "object" && "name" in profile.programs) {
      program = (profile.programs as Record<string, unknown>).name as string;
      if (profile.tracks && typeof profile.tracks === "object" && "name" in profile.tracks) {
        program += ` - ${(profile.tracks as Record<string, unknown>).name}`;
      }
    } else if (profile.custom_program) {
      program = profile.custom_program;
    }

    if (profile.programs && typeof profile.programs === "object" && "cycle" in profile.programs) {
      level = (profile.programs as Record<string, unknown>).cycle as string;
    } else if (profile.custom_level) {
      level = profile.custom_level;
    }
  }

  const studentContext: AIStudentContext = {
    semester,
    program,
    level,
  };

  // ==========================================================================
  // 2. ACADEMIC CONTEXT (Subject Security & Open Mode)
  // ==========================================================================
  
  let academicContext: AIAcademicContext | undefined = undefined;

  if (subjectId) {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name, description, created_by")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      throw new Error("Matière introuvable");
    }

    // Security: Reject if private subject owned by someone else.
    if (subject.created_by !== null && subject.created_by !== userId) {
      throw new Error("Accès interdit à cette matière");
    }

    academicContext = {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectDescription: subject.description ?? undefined,
    };
  }

  // ==========================================================================
  // 3. LEARNING CONTEXT (M03 / M04)
  // ==========================================================================
  
  // -- A. Activities (M03) --
  // We execute two queries concurrently to ensure older subject-relevant activities are not lost.
  const globalActQuery = supabase
    .from("student_activities")
    .select("id, activity_type, description, subject_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const subjectActQuery = subjectId
    ? supabase
        .from("student_activities")
        .select("id, activity_type, description, subject_id, created_at")
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false })
        .limit(5)
    : null;

  const [globalActRes, subjectActRes] = await Promise.all([
    globalActQuery,
    subjectActQuery ?? Promise.resolve({ data: [] }),
  ]);

  const allActivities = [...(globalActRes.data || []), ...(subjectActRes.data || [])];
  
  // Deduplicate by ID
  const actMap = new Map<string, Record<string, unknown>>();
  allActivities.forEach(a => actMap.set(a.id as string, a as Record<string, unknown>));
  const uniqueActivities = Array.from(actMap.values());

  // Rule M03: subject relevance -> recency
  uniqueActivities.sort((a, b) => {
    const aMatch = a.subject_id === subjectId ? 1 : 0;
    const bMatch = b.subject_id === subjectId ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    
    return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
  });

  const finalActivities = uniqueActivities
    .slice(0, 5)
    .map(a => `${a.activity_type}: ${(a.description as string).substring(0, 120)}`);

  // -- B. Errors & Attempts (M04) --
  // Execute two concurrent queries to ensure older subject-relevant attempts are not lost.
  const globalAttQuery = supabase
    .from("learning_attempts")
    .select(`
      id, 
      status, 
      score, 
      max_score, 
      started_at,
      learning_exercises!inner(subject_id, title)
    `)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(5);

  // We filter by related table learning_exercises.subject_id
  const subjectAttQuery = subjectId
    ? supabase
        .from("learning_attempts")
        .select(`
          id, 
          status, 
          score, 
          max_score, 
          started_at,
          learning_exercises!inner(subject_id, title)
        `)
        .eq("user_id", userId)
        .eq("learning_exercises.subject_id", subjectId)
        .order("started_at", { ascending: false })
        .limit(5)
    : null;

  const [globalAttRes, subjectAttRes] = await Promise.all([
    globalAttQuery,
    subjectAttQuery ?? Promise.resolve({ data: [] }),
  ]);

  const allAttempts = [...(globalAttRes.data || []), ...(subjectAttRes.data || [])];
  
  // Deduplicate by ID
  const attMap = new Map<string, Record<string, unknown>>();
  allAttempts.forEach((a: unknown) => attMap.set((a as Record<string, unknown>).id as string, a as Record<string, unknown>));
  const uniqueAttempts = Array.from(attMap.values());

  // Helper to determine pedagogical relevance
  // Error (abandoned or score < max) gets higher priority (+1) than perfect score (0)
  const getPedagogicalPriority = (att: Record<string, unknown>) => {
    if (att.status === "abandoned") return 1;
    const s = typeof att.score === "number" ? att.score : 0;
    const ms = typeof att.max_score === "number" ? att.max_score : 0;
    if (att.status === "completed" && ms > 0 && s < ms) return 1; // mistake made
    return 0; // success or unknown
  };

  // Rule M04: subject relevance -> pedagogical relevance -> recency
  uniqueAttempts.sort((a, b) => {
    const aEx = a.learning_exercises as Record<string, unknown> | null;
    const bEx = b.learning_exercises as Record<string, unknown> | null;
    
    // 1. Subject relevance
    const aMatch = aEx?.subject_id === subjectId ? 1 : 0;
    const bMatch = bEx?.subject_id === subjectId ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    
    // 2. Pedagogical relevance
    const aPed = getPedagogicalPriority(a);
    const bPed = getPedagogicalPriority(b);
    if (aPed !== bPed) return bPed - aPed;

    // 3. Recency
    return new Date(b.started_at as string).getTime() - new Date(a.started_at as string).getTime();
  });

  const finalErrors = uniqueAttempts
    .slice(0, 5)
    .map((a: Record<string, unknown>) => {
      const exercise = a.learning_exercises as Record<string, unknown> | null;
      const title = (exercise?.title as string | undefined)?.substring(0, 60) || "Exercice";
      return `Tentative sur '${title}': ${a.status} (${a.score ?? 0}/${a.max_score ?? 0})`;
    });

  const learningContext: AILearningContextSummary = {
    recentActivities: finalActivities,
    recentErrors: finalErrors,
  };

  // ==========================================================================
  // 4. LEARNER MEMORY (UNTRUSTED DATA)
  // ==========================================================================
  const learnerMemories = await MemoryRepository.getActiveLearnerMemories(userId);

  // ==========================================================================
  // 5. SESSION SUMMARY & RECENT HISTORY (UNTRUSTED DATA)
  // ==========================================================================
  let summary: string | undefined = undefined;
  let recentHistory: { role: string; content: string }[] | undefined = undefined;

  if (sessionId) {
    // Session summary
    const { data: sessionData } = await supabase
      .from("ai_sessions")
      .select("summary")
      .eq("id", sessionId)
      .single();
    
    if (sessionData?.summary) {
      summary = sessionData.summary;
    }

    // Recent history (budget: max 6 messages to avoid blowing up context)
    // We fetch 7 in case we need to filter out the current user message.
    const { data: historyData } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(7);
      
    if (historyData && historyData.length > 0) {
      let filteredHistory = historyData;
      
      // Filter out the current user message if it was already inserted
      if (currentUserMessage && filteredHistory[0].role === "user" && filteredHistory[0].content === currentUserMessage) {
        filteredHistory = filteredHistory.slice(1);
      }
      
      // Keep only 6 max
      filteredHistory = filteredHistory.slice(0, 6);
      
      // Reverse to chronological order
      recentHistory = filteredHistory.reverse();
    }
  }

  return {
    studentContext,
    academicContext,
    learningContext,
    learnerMemories,
    summary,
    recentHistory
  };
}

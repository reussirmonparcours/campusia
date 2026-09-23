import { createClient } from "@/lib/supabase/server";
import { 
  ExamSession, 
  ExamStatus, 
  GetExamResultsResponse, 
  ExamRecommendationResult,
  ExamQuestionResult,
  ExamQuestionChoiceResult,
  ExamQuestionStatus,
  ExamHistoryAnalysis,
  ExamTimelinePoint,
  ExamSubjectPerformance
} from "@/types/exam";
import { QuestionWithChoices } from "@/types/learning";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface EligibleExercise {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard";
  exercise_type: string;
  subject_id: string | null;
  subject_name: string;
  total_questions: number;
}

export interface UserExamSessionItem {
  id: string;
  exercise_title: string;
  subject_id?: string | null;
  subject_name: string;
  status: ExamStatus;
  duration_minutes: number;
  total_questions: number;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  score: number | null;
  max_score: number | null;
}

export interface ExamSessionDetail {
  session: ExamSession;
  exercise: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    subject_name: string;
  };
  questions: QuestionWithChoices[];
  savedAnswers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }>;
  attempt: {
    id: string;
    score: number | null;
    max_score: number | null;
    status: string;
  } | null;
}

/**
 * Récupère les exercices M04 éligibles pour une simulation d'examen.
 * Ne retourne que ceux disposant d'au moins une question.
 */
export async function getEligibleExercises(): Promise<EligibleExercise[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("learning_exercises")
    .select(`
      id,
      title,
      description,
      difficulty,
      exercise_type,
      subject_id,
      subjects ( id, name ),
      learning_questions ( id )
    `)
    .order("title", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => {
      const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
      const questions = item.learning_questions || [];
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        difficulty: item.difficulty,
        exercise_type: item.exercise_type,
        subject_id: item.subject_id,
        subject_name: subject?.name || "Matière générale",
        total_questions: questions.length,
      };
    })
    .filter((ex) => ex.total_questions > 0);
}

/**
 * Récupère l'historique des sessions d'examen de l'étudiant.
 */
export async function getUserExamSessions(): Promise<UserExamSessionItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("exam_sessions")
    .select(`
      id,
      status,
      duration_minutes,
      started_at,
      expires_at,
      completed_at,
      created_at,
      learning_exercises (
        id,
        title,
        subjects ( id, name )
      ),
      exam_questions ( id ),
      exam_attempts (
        learning_attempts (
          id,
          score,
          max_score,
          status
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exercise = item.learning_exercises as any;
    const subject = exercise?.subjects;
    const questions = item.exam_questions || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attempt = item.exam_attempts?.[0]?.learning_attempts as any;

    return {
      id: item.id,
      exercise_title: exercise?.title || "Examen blanc",
      subject_id: subject?.id || null,
      subject_name: subject?.name || "Matière",
      status: item.status as ExamStatus,
      duration_minutes: item.duration_minutes,
      total_questions: questions.length,
      started_at: item.started_at,
      expires_at: item.expires_at,
      completed_at: item.completed_at,
      created_at: item.created_at,
      score: attempt?.score ?? null,
      max_score: attempt?.max_score ?? null,
    };
  });
}

/**
 * Récupère tous les détails nécessaires à une session d'examen :
 * - session
 * - questions figées dans exam_questions ordonnées
 * - réponses déjà soumises dans learning_answers (pour reprise après refresh)
 */
export async function getExamSessionDetails(sessionId: string): Promise<ExamSessionDetail | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Session de l'utilisateur
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .select(`
      id,
      user_id,
      learning_exercise_id,
      status,
      duration_minutes,
      started_at,
      expires_at,
      completed_at,
      created_at,
      updated_at,
      learning_exercises (
        id,
        title,
        description,
        difficulty,
        subjects ( id, name )
      ),
      exam_attempts (
        learning_attempts (
          id,
          score,
          max_score,
          status
        )
      )
    `)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exerciseData = session.learning_exercises as any;
  const subjectData = exerciseData?.subjects;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attemptData = session.exam_attempts?.[0]?.learning_attempts as any;

  // 2. Questions figées de la session
  const { data: frozenQuestions, error: qError } = await supabase
    .from("exam_questions")
    .select(`
      id,
      order_index,
      learning_question_id,
      learning_questions (
        id,
        exercise_id,
        question_type,
        content,
        explanation,
        order_index,
        difficulty,
        created_at,
        updated_at,
        learning_choices (
          id,
          question_id,
          content,
          order_index,
          created_at
        )
      )
    `)
    .eq("exam_session_id", sessionId)
    .order("order_index", { ascending: true });

  if (qError || !frozenQuestions) {
    return null;
  }

  // 3. Mapper les questions dans l'ordre strict déterminé par exam_questions
  const questions: QuestionWithChoices[] = [];
  for (const fq of frozenQuestions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lq = fq.learning_questions as any;
    if (!lq) continue;

    // Choix ordonnés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const choices = (lq.learning_choices || []).sort((a: any, b: any) => {
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });

    questions.push({
      id: lq.id,
      exercise_id: lq.exercise_id,
      question_type: lq.question_type,
      content: lq.content,
      explanation: null,
      order_index: fq.order_index,
      difficulty: lq.difficulty,
      created_at: lq.created_at,
      updated_at: lq.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      learning_choices: choices.map((c: any) => ({
        id: c.id,
        question_id: c.question_id,
        content: c.content,
        explanation: null,
        created_at: c.created_at,
      })),
    });
  }

  // 4. Réponses déjà soumises dans learning_answers si une tentative existe
  const savedAnswers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }> = {};

  if (attemptData?.id) {
    const { data: answers } = await supabase
      .from("learning_answers")
      .select("question_id, choice_id, free_text_answer")
      .eq("attempt_id", attemptData.id);

    if (answers) {
      for (const ans of answers) {
        savedAnswers[ans.question_id] = {
          choiceId: ans.choice_id,
          freeTextAnswer: ans.free_text_answer,
        };
      }
    }
  }

  return {
    session: {
      id: session.id,
      user_id: session.user_id,
      learning_exercise_id: session.learning_exercise_id,
      status: session.status as ExamStatus,
      duration_minutes: session.duration_minutes,
      started_at: session.started_at,
      expires_at: session.expires_at,
      completed_at: session.completed_at,
      created_at: session.created_at,
      updated_at: session.updated_at,
    },
    exercise: {
      id: exerciseData?.id || session.learning_exercise_id,
      title: exerciseData?.title || "Examen blanc",
      description: exerciseData?.description || null,
      difficulty: exerciseData?.difficulty || "medium",
      subject_name: subjectData?.name || "Matière",
    },
    questions,
    savedAnswers,
    attempt: attemptData
      ? {
          id: attemptData.id,
          score: attemptData.score ?? null,
          max_score: attemptData.max_score ?? null,
          status: attemptData.status,
        }
      : null,
  };
}

/**
 * Calcule la recommandation déterministe basée strictement sur les seuils validés M08.4 :
 * - >= 80% : Très satisfaisant
 * - 50-79% : Performance correcte
 * - < 50% : À retravailler
 * Évalue UNIQUEMENT la performance sur cette simulation (aucun jugement global sur l'étudiant).
 */
export function getExamRecommendation(percentage: number): ExamRecommendationResult {
  if (percentage >= 80) {
    return {
      badge: "Très satisfaisant",
      message: "Très bonne performance sur cette simulation. Continue à t'entraîner régulièrement.",
      level: "high",
    };
  }
  if (percentage >= 50) {
    return {
      badge: "Performance correcte",
      message: "Performance correcte sur cette simulation. Revois les questions manquées avant une nouvelle tentative.",
      level: "medium",
    };
  }
  return {
    badge: "À retravailler",
    message: "Cette simulation révèle plusieurs points à retravailler. Nous te recommandons une session de révision ciblée.",
    level: "low",
  };
}

/**
 * Récupère de manière sécurisée les résultats complets d'une session d'examen terminée.
 * RÈGLES CRITIQUES M08.4 :
 * 1. Vérifie l'utilisateur authentifié.
 * 2. Charge uniquement la session appartenant à cet utilisateur.
 * 3. Vérifie que le statut est strictement 'submitted' ou 'expired' (bloque 'planned', 'active', 'abandoned').
 * 4. Retrouve le learning_attempt associé (M04).
 * 5. Vérifie que la tentative est 'completed' (condition absolue pour révéler les corrections).
 * 6. Ne recalcule JAMAIS le score : le score affiché provient authoritativement de learning_attempts.
 * 7. Ne génère aucune explication artificielle si aucune n'est présente en base de données.
 */
export async function getExamResults(sessionId: string): Promise<GetExamResultsResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { 
      success: false, 
      error: "Vous devez être connecté pour consulter les résultats.", 
      code: "UNAUTHORIZED" 
    };
  }

  if (!sessionId || typeof sessionId !== "string") {
    return { 
      success: false, 
      error: "Identifiant de session manquant ou invalide.", 
      code: "NOT_FOUND" 
    };
  }

  // 1. Charger la session appartenant à l'utilisateur
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .select(`
      id,
      user_id,
      learning_exercise_id,
      status,
      duration_minutes,
      started_at,
      expires_at,
      completed_at,
      created_at,
      updated_at,
      learning_exercises (
        id,
        title,
        description,
        difficulty,
        subject_id,
        subjects ( id, name )
      ),
      exam_attempts (
        learning_attempt_id,
        learning_attempts (
          id,
          user_id,
          score,
          max_score,
          status,
          started_at,
          completed_at
        )
      )
    `)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return { 
      success: false, 
      error: "Session d'examen introuvable ou accès refusé.", 
      code: "NOT_FOUND" 
    };
  }

  // 2. Vérification d'état : seules les sessions 'submitted' ou 'expired' sont autorisées
  if (session.status === "planned" || session.status === "active") {
    return { 
      success: false, 
      error: "Cette session d'examen est toujours en cours. Les résultats ne sont consultables qu'une fois l'épreuve terminée.", 
      code: "SESSION_ACTIVE",
      status: session.status
    };
  }

  if (session.status !== "submitted" && session.status !== "expired") {
    return { 
      success: false, 
      error: "Cette session n'est pas dans un état permettant la consultation des résultats.", 
      code: "INVALID_STATUS",
      status: session.status
    };
  }

  // 3. Vérification de la tentative M04 liée
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attemptData = session.exam_attempts?.[0]?.learning_attempts as any;
  if (!attemptData) {
    return { 
      success: false, 
      error: "Tentative d'apprentissage liée introuvable.", 
      code: "NO_ATTEMPT" 
    };
  }

  if (attemptData.status !== "completed") {
    return { 
      success: false, 
      error: "La tentative d'apprentissage n'est pas encore finalisée.", 
      code: "ATTEMPT_NOT_COMPLETED" 
    };
  }

  // 4. Source de vérité pédagogique : M04 authoritative score (AUCUN RECALCUL)
  const score = attemptData.score ?? null;
  const maxScore = attemptData.max_score ?? null;
  const percentage = (score !== null && maxScore !== null && maxScore > 0)
    ? Math.round((score / maxScore) * 100)
    : (score === 0 ? 0 : null);

  // 5. Charger les questions figées dans exam_questions
  const { data: frozenQuestions, error: qError } = await supabase
    .from("exam_questions")
    .select(`
      id,
      order_index,
      learning_question_id,
      learning_questions (
        id,
        exercise_id,
        question_type,
        content,
        explanation,
        difficulty,
        order_index,
        learning_choices (
          id,
          content,
          explanation,
          order_index,
          learning_choice_corrections (
            is_correct
          )
        )
      )
    `)
    .eq("exam_session_id", sessionId)
    .order("order_index", { ascending: true });

  if (qError || !frozenQuestions) {
    return { 
      success: false, 
      error: "Impossible de charger les questions de l'examen.", 
      code: "ERROR" 
    };
  }

  // 6. Charger les réponses enregistrées dans learning_answers
  const { data: answers } = await supabase
    .from("learning_answers")
    .select("id, question_id, choice_id, free_text_answer, is_correct, submitted_at")
    .eq("attempt_id", attemptData.id);

  const answersMap = new Map<string, {
    choiceId: string | null;
    freeTextAnswer: string | null;
    isCorrect: boolean | null;
    submittedAt: string | null;
  }>();

  if (answers) {
    for (const ans of answers) {
      answersMap.set(ans.question_id, {
        choiceId: ans.choice_id,
        freeTextAnswer: ans.free_text_answer,
        isCorrect: ans.is_correct,
        submittedAt: ans.submitted_at,
      });
    }
  }

  // 7. Traitement et structuration sans fuite de secrets
  const questionResults: ExamQuestionResult[] = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let unevaluatedCount = 0;

  for (const fq of frozenQuestions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lq = fq.learning_questions as any;
    if (!lq) continue;

    // Choix ordonnés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawChoices = (lq.learning_choices || []).sort((a: any, b: any) => {
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const choices: ExamQuestionChoiceResult[] = rawChoices.map((c: any) => {
      let isCorrect = false;
      if (Array.isArray(c.learning_choice_corrections)) {
        isCorrect = Boolean(c.learning_choice_corrections[0]?.is_correct);
      } else if (c.learning_choice_corrections) {
        isCorrect = Boolean(c.learning_choice_corrections.is_correct);
      }
      return {
        id: c.id,
        content: c.content,
        isCorrect,
        explanation: c.explanation || null,
      };
    });

    const userAnswer = answersMap.get(lq.id) || null;

    let status: ExamQuestionStatus = 'unanswered';
    if (!userAnswer || (userAnswer.choiceId === null && !userAnswer.freeTextAnswer)) {
      status = 'unanswered';
      unansweredCount++;
    } else if (lq.question_type === 'free_text') {
      status = 'unevaluated';
      unevaluatedCount++;
    } else if (userAnswer.isCorrect === true) {
      status = 'correct';
      correctCount++;
    } else {
      status = 'incorrect';
      incorrectCount++;
    }

    questionResults.push({
      id: lq.id,
      orderIndex: fq.order_index,
      content: lq.content,
      questionType: lq.question_type,
      difficulty: lq.difficulty || 'medium',
      explanation: lq.explanation || null,
      userAnswer,
      choices,
      status,
    });
  }

  // 8. Calcul du temps effectif passé
  let elapsedSeconds: number | null = null;
  if (session.started_at && session.completed_at) {
    const startMs = new Date(session.started_at).getTime();
    const endMs = new Date(session.completed_at).getTime();
    if (endMs >= startMs) {
      elapsedSeconds = Math.min(
        Math.round((endMs - startMs) / 1000),
        session.duration_minutes * 60
      );
    }
  }

  // 9. Questions à revoir (uniquement celles manquées ou sans réponse)
  const questionsToReview = questionResults.filter(
    (q) => q.status === "incorrect" || q.status === "unanswered"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exerciseData = session.learning_exercises as any;
  const subjectData = exerciseData?.subjects;

  return {
    success: true,
    data: {
      session: {
        id: session.id,
        status: session.status as "submitted" | "expired",
        durationMinutes: session.duration_minutes,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        elapsedSeconds,
        attemptId: attemptData.id,
      },
      exercise: {
        id: exerciseData?.id || session.learning_exercise_id,
        title: exerciseData?.title || "Examen blanc",
        description: exerciseData?.description || null,
        difficulty: exerciseData?.difficulty || "medium",
        subjectId: exerciseData?.subject_id || null,
        subjectName: subjectData?.name || "Matière générale",
      },
      score: {
        score,
        maxScore,
        percentage,
      },
      summary: {
        totalQuestions: questionResults.length,
        correctQuestions: correctCount,
        incorrectQuestions: incorrectCount,
        unansweredQuestions: unansweredCount,
        unevaluatedQuestions: unevaluatedCount,
      },
      recommendation: getExamRecommendation(percentage ?? 0),
      questions: questionResults,
      questionsToReview,
    },
  };
}

/**
 * Calcule les métriques analytiques d'historique (M08.4.3) de manière pure et déterministe.
 * Prend en entrée un tableau de sessions.
 */
export function computeExamAnalytics(
  sessions: Array<{
    id: string;
    status: ExamStatus;
    completed_at: string | null;
    created_at: string;
    subject_id?: string | null;
    subject_name: string;
    exercise_title?: string;
    score: number | null;
    max_score: number | null;
  }>
): ExamHistoryAnalysis {
  // 1. Filtrer uniquement les sessions ayant produit un résultat : 'submitted' ou 'expired'
  // Exclure : 'active', 'planned', 'abandoned'
  const validSessions = sessions.filter(
    (s) => s.status === "submitted" || s.status === "expired"
  );

  if (validSessions.length === 0) {
    return {
      global: {
        totalSimulations: 0,
        averageScorePercentage: null,
        bestScorePercentage: null,
        lastSimulationDate: null,
      },
      timeline: [],
      bySubject: {},
    };
  }

  // 2. Trouver la date de la dernière simulation (completed_at en priorité, sinon created_at)
  const sortedByDateDesc = [...validSessions].sort((a, b) => {
    const dateA = new Date(a.completed_at || a.created_at).getTime();
    const dateB = new Date(b.completed_at || b.created_at).getTime();
    return dateB - dateA;
  });
  const lastSimulation = sortedByDateDesc[0];
  const lastSimulationDate = lastSimulation.completed_at || lastSimulation.created_at;

  // 3. Calculer les pourcentages uniquement pour les simulations ayant un score exploitable
  // Règle stricte M08.4.3 :
  // score !== null && max_score !== null && max_score > 0
  // Ne pas considérer une absence de score comme 0%.
  type ScoredSession = (typeof validSessions)[0] & { percentage: number };
  const scoredSessions: ScoredSession[] = [];

  for (const s of validSessions) {
    if (s.score !== null && s.max_score !== null && s.max_score > 0) {
      const pct = Math.round((s.score / s.max_score) * 100);
      scoredSessions.push({ ...s, percentage: pct });
    }
  }

  // Métriques globales
  let averageScorePercentage: number | null = null;
  let bestScorePercentage: number | null = null;

  if (scoredSessions.length > 0) {
    const totalPercentage = scoredSessions.reduce((acc, s) => acc + s.percentage, 0);
    averageScorePercentage = Math.round(totalPercentage / scoredSessions.length);
    bestScorePercentage = Math.max(...scoredSessions.map((s) => s.percentage));
  }

  // 4. Timeline chronologique (ordre croissant : de la plus ancienne à la plus récente)
  const timelineSortedAsc = [...scoredSessions].sort((a, b) => {
    const dateA = new Date(a.completed_at || a.created_at).getTime();
    const dateB = new Date(b.completed_at || b.created_at).getTime();
    return dateA - dateB;
  });

  const timeline: ExamTimelinePoint[] = timelineSortedAsc.map((s) => {
    const d = new Date(s.completed_at || s.created_at);
    const dateFormatted = format(d, "d MMM", { locale: fr });
    return {
      date: dateFormatted,
      percentage: s.percentage,
      subjectName: s.subject_name,
      sessionId: s.id,
      exerciseTitle: s.exercise_title,
      status: s.status,
    };
  });

  // 5. Regroupement par matière (bySubject)
  // Données descriptives uniquement : subjectName, simulationsCount, averagePercentage
  const subjectMap: Record<
    string,
    {
      subjectName: string;
      simulationsCount: number;
      scores: number[];
    }
  > = {};

  for (const s of validSessions) {
    const key = s.subject_id || s.subject_name;
    if (!subjectMap[key]) {
      subjectMap[key] = {
        subjectName: s.subject_name,
        simulationsCount: 0,
        scores: [],
      };
    }
    subjectMap[key].simulationsCount += 1;
    if (s.score !== null && s.max_score !== null && s.max_score > 0) {
      subjectMap[key].scores.push(Math.round((s.score / s.max_score) * 100));
    }
  }

  const bySubject: Record<string, ExamSubjectPerformance> = {};
  for (const [key, val] of Object.entries(subjectMap)) {
    const avg =
      val.scores.length > 0
        ? Math.round(val.scores.reduce((a, b) => a + b, 0) / val.scores.length)
        : 0;
    bySubject[key] = {
      subjectName: val.subjectName,
      simulationsCount: val.simulationsCount,
      averagePercentage: avg,
    };
  }

  return {
    global: {
      totalSimulations: validSessions.length,
      averageScorePercentage,
      bestScorePercentage,
      lastSimulationDate,
    },
    timeline,
    bySubject,
  };
}

/**
 * Récupère et calcule côté serveur l'analyse d'historique de l'étudiant connecté (M08.4.3).
 * Strictement user-scoped : l'utilisateur authentifié est extrait du contexte Supabase serveur.
 */
export async function getExamAnalytics(): Promise<ExamHistoryAnalysis> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      global: {
        totalSimulations: 0,
        averageScorePercentage: null,
        bestScorePercentage: null,
        lastSimulationDate: null,
      },
      timeline: [],
      bySubject: {},
    };
  }

  const { data, error } = await supabase
    .from("exam_sessions")
    .select(`
      id,
      status,
      duration_minutes,
      started_at,
      expires_at,
      completed_at,
      created_at,
      learning_exercises (
        id,
        title,
        subject_id,
        subjects ( id, name )
      ),
      exam_attempts (
        learning_attempts (
          id,
          score,
          max_score,
          status
        )
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["submitted", "expired"])
    .order("completed_at", { ascending: true });

  if (error || !data) {
    return {
      global: {
        totalSimulations: 0,
        averageScorePercentage: null,
        bestScorePercentage: null,
        lastSimulationDate: null,
      },
      timeline: [],
      bySubject: {},
    };
  }

  const sessions = data.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exercise = item.learning_exercises as any;
    const subject = exercise?.subjects;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attempt = item.exam_attempts?.[0]?.learning_attempts as any;

    return {
      id: item.id,
      status: item.status as ExamStatus,
      completed_at: item.completed_at,
      created_at: item.created_at,
      subject_id: subject?.id ?? exercise?.subject_id ?? null,
      subject_name: subject?.name || "Matière",
      exercise_title: exercise?.title || "Examen blanc",
      score: attempt?.score ?? null,
      max_score: attempt?.max_score ?? null,
    };
  });

  return computeExamAnalytics(sessions);
}


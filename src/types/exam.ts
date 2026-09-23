import { z } from "zod";

export type ExamStatus = 'planned' | 'active' | 'submitted' | 'expired' | 'abandoned';

export interface ExamSession {
  id: string;
  user_id: string;
  learning_exercise_id: string;
  status: ExamStatus;
  duration_minutes: number;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_session_id: string;
  learning_question_id: string;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  exam_session_id: string;
  learning_attempt_id: string;
}

// Zod schemas for Server Actions
export const createExamSchema = z.object({
  exerciseId: z.string().uuid(),
  durationMinutes: z.number().int().positive().max(300),
  questionCount: z.number().int().positive().optional(),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const startExamSchema = z.object({
  sessionId: z.string().uuid(),
});
export type StartExamInput = z.infer<typeof startExamSchema>;

export const submitExamAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  choiceId: z.string().uuid().optional().nullable(),
  freeTextAnswer: z.string().optional().nullable(),
});
export type SubmitExamAnswerInput = z.infer<typeof submitExamAnswerSchema>;

export const finishExamSchema = z.object({
  sessionId: z.string().uuid(),
});
export type FinishExamInput = z.infer<typeof finishExamSchema>;

// Types M08.4.2 — Résultats et Analyse
export type ExamQuestionStatus = 'correct' | 'incorrect' | 'unanswered' | 'unevaluated';

export interface ExamQuestionChoiceResult {
  id: string;
  content: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface ExamUserAnswerResult {
  choiceId: string | null;
  freeTextAnswer: string | null;
  isCorrect: boolean | null;
  submittedAt: string | null;
}

export interface ExamQuestionResult {
  id: string;
  orderIndex: number;
  content: string;
  questionType: 'single_choice' | 'multiple_choice' | 'free_text';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string | null;
  userAnswer: ExamUserAnswerResult | null;
  choices: ExamQuestionChoiceResult[];
  status: ExamQuestionStatus;
}

export interface ExamRecommendationResult {
  badge: string;
  message: string;
  level: 'high' | 'medium' | 'low';
}

export interface ExamResultsData {
  session: {
    id: string;
    status: 'submitted' | 'expired';
    durationMinutes: number;
    startedAt: string | null;
    completedAt: string | null;
    elapsedSeconds: number | null;
    attemptId: string | null;
  };
  exercise: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    subjectId: string | null;
    subjectName: string;
  };
  score: {
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
  };
  summary: {
    totalQuestions: number;
    correctQuestions: number;
    incorrectQuestions: number;
    unansweredQuestions: number;
    unevaluatedQuestions: number;
  };
  recommendation: ExamRecommendationResult;
  questions: ExamQuestionResult[];
  questionsToReview: ExamQuestionResult[];
}

export type GetExamResultsErrorCode = 
  | 'UNAUTHORIZED' 
  | 'NOT_FOUND' 
  | 'SESSION_ACTIVE' 
  | 'INVALID_STATUS' 
  | 'NO_ATTEMPT' 
  | 'ATTEMPT_NOT_COMPLETED' 
  | 'ERROR';

export type GetExamResultsResponse = 
  | { success: true; data: ExamResultsData }
  | { success: false; error: string; code: GetExamResultsErrorCode; status?: string };

// Types M08.4.3 — Historique & Analyse des simulations
export interface ExamGlobalKPIs {
  totalSimulations: number;
  averageScorePercentage: number | null;
  bestScorePercentage: number | null;
  lastSimulationDate: string | null;
}

export interface ExamTimelinePoint {
  date: string;
  percentage: number;
  subjectName: string;
  sessionId?: string;
  exerciseTitle?: string;
  status?: ExamStatus;
}

export interface ExamSubjectPerformance {
  subjectName: string;
  simulationsCount: number;
  averagePercentage: number;
}

export interface ExamHistoryAnalysis {
  global: ExamGlobalKPIs;
  timeline: ExamTimelinePoint[];
  bySubject: Record<string, ExamSubjectPerformance>;
}


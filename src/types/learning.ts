export type ExerciseType = 'quiz' | 'exam' | 'practice';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'free_text';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'started' | 'completed' | 'abandoned';

export interface LearningExercise {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  exercise_type: ExerciseType;
  difficulty: Difficulty;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningQuestion {
  id: string;
  exercise_id: string;
  question_type: QuestionType;
  content: string;
  explanation: string | null;
  order_index: number;
  difficulty: Difficulty;
  created_at: string;
  updated_at: string;
}

export interface LearningChoice {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  explanation: string | null;
  created_at: string;
}

export interface LearningAttempt {
  id: string;
  user_id: string;
  exercise_id: string;
  status: AttemptStatus;
  score: number | null;
  max_score: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface LearningAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  choice_id: string | null;
  free_text_answer: string | null;
  is_correct: boolean | null;
  submitted_at: string;
}

// Composites for the frontend
export interface QuestionWithChoices extends LearningQuestion {
  learning_choices: Omit<LearningChoice, 'is_correct'>[];
}

export interface ExerciseWithQuestions extends LearningExercise {
  learning_questions: QuestionWithChoices[];
}

import { z } from "zod";

export const startAttemptSchema = z.object({
  exerciseId: z.string().uuid(),
});
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const submitAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  choiceId: z.string().uuid().optional().nullable(),
  freeTextAnswer: z.string().optional().nullable(),
});
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const completeAttemptSchema = z.object({
  attemptId: z.string().uuid(),
});
export type CompleteAttemptInput = z.infer<typeof completeAttemptSchema>;

-- ==============================================================================
-- Migration: 20260919000002_m04_learning_engine.sql
-- Milestone 04 — Learning Engine (Exercises, Questions, Attempts, Answers)
-- ==============================================================================

-- 1. LEARNING EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.learning_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    exercise_type TEXT NOT NULL DEFAULT 'quiz' CHECK (exercise_type IN ('quiz', 'exam', 'practice')),
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means official
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. LEARNING QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.learning_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.learning_exercises(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'free_text')),
    content TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LEARNING CHOICES TABLE
CREATE TABLE IF NOT EXISTS public.learning_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.learning_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. LEARNING ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.learning_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.learning_exercises(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'abandoned')),
    score INTEGER,
    max_score INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 5. LEARNING ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.learning_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.learning_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.learning_questions(id) ON DELETE CASCADE,
    choice_id UUID REFERENCES public.learning_choices(id) ON DELETE CASCADE,
    free_text_answer TEXT,
    is_correct BOOLEAN,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(attempt_id, question_id)
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_learning_exercises_subject_id ON public.learning_exercises(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_exercises_created_by ON public.learning_exercises(created_by);

CREATE INDEX IF NOT EXISTS idx_learning_questions_exercise_id ON public.learning_questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_learning_choices_question_id ON public.learning_choices(question_id);

CREATE INDEX IF NOT EXISTS idx_learning_attempts_user_id ON public.learning_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_attempts_exercise_id ON public.learning_attempts(exercise_id);

CREATE INDEX IF NOT EXISTS idx_learning_answers_attempt_id ON public.learning_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_learning_answers_question_id ON public.learning_answers(question_id);

-- 7. RLS & SECURITY
ALTER TABLE public.learning_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_answers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_choices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_answers TO authenticated;

-- Policies for learning_exercises
-- Anyone can see official exercises (created_by IS NULL) or their own.
CREATE POLICY "learning_exercises_select" ON public.learning_exercises
    FOR SELECT TO authenticated
    USING (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "learning_exercises_insert" ON public.learning_exercises
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "learning_exercises_update" ON public.learning_exercises
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "learning_exercises_delete" ON public.learning_exercises
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Policies for learning_questions
-- Same visibility as exercises
CREATE POLICY "learning_questions_select" ON public.learning_questions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_exercises e 
        WHERE e.id = exercise_id AND (e.created_by IS NULL OR e.created_by = auth.uid())
    ));

CREATE POLICY "learning_questions_all_mod" ON public.learning_questions
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_exercises e 
        WHERE e.id = exercise_id AND e.created_by = auth.uid()
    ));

-- Policies for learning_choices
-- Same visibility as questions
CREATE POLICY "learning_choices_select" ON public.learning_choices
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_questions q
        JOIN public.learning_exercises e ON e.id = q.exercise_id
        WHERE q.id = question_id AND (e.created_by IS NULL OR e.created_by = auth.uid())
    ));

CREATE POLICY "learning_choices_all_mod" ON public.learning_choices
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_questions q
        JOIN public.learning_exercises e ON e.id = q.exercise_id
        WHERE q.id = question_id AND e.created_by = auth.uid()
    ));

-- Policies for learning_attempts
-- A user can only see and modify their own attempts
CREATE POLICY "learning_attempts_select" ON public.learning_attempts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "learning_attempts_insert" ON public.learning_attempts
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.learning_exercises e
        WHERE e.id = exercise_id AND (e.created_by IS NULL OR e.created_by = auth.uid())
    ));

CREATE POLICY "learning_attempts_update" ON public.learning_attempts
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "learning_attempts_delete" ON public.learning_attempts
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Policies for learning_answers
-- A user can only see and modify answers for their own attempts
CREATE POLICY "learning_answers_select" ON public.learning_answers
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_attempts a
        WHERE a.id = attempt_id AND a.user_id = auth.uid()
    ));

CREATE POLICY "learning_answers_insert" ON public.learning_answers
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.learning_attempts a
        WHERE a.id = attempt_id AND a.user_id = auth.uid()
    ));

CREATE POLICY "learning_answers_update" ON public.learning_answers
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_attempts a
        WHERE a.id = attempt_id AND a.user_id = auth.uid()
    ));

CREATE POLICY "learning_answers_delete" ON public.learning_answers
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_attempts a
        WHERE a.id = attempt_id AND a.user_id = auth.uid()
    ));

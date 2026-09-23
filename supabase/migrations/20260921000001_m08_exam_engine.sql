-- ==============================================================================
-- Migration: 20260921000001_m08_exam_engine.sql
-- Milestone 08 — Exam Engine & Security Patch
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY PATCH FOR M04 (is_correct vulnerability)
-- ==============================================================================
-- Extract is_correct to a separate secure table to prevent client-side exposure
CREATE TABLE IF NOT EXISTS public.learning_choice_corrections (
    choice_id UUID PRIMARY KEY REFERENCES public.learning_choices(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Migrate data
INSERT INTO public.learning_choice_corrections (choice_id, is_correct)
SELECT id, is_correct FROM public.learning_choices
ON CONFLICT DO NOTHING;

-- Drop vulnerable column
ALTER TABLE public.learning_choices DROP COLUMN IF EXISTS is_correct;

-- RLS for corrections (only authors can see their own corrections directly)
ALTER TABLE public.learning_choice_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corrections_select_author" ON public.learning_choice_corrections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_choices c
        JOIN public.learning_questions q ON q.id = c.question_id
        JOIN public.learning_exercises e ON e.id = q.exercise_id
        WHERE c.id = choice_id AND e.created_by = auth.uid()
    ));

CREATE POLICY "corrections_select_completed_attempt" ON public.learning_choice_corrections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_choices c
        JOIN public.learning_questions q ON q.id = c.question_id
        JOIN public.learning_attempts a ON a.exercise_id = q.exercise_id
        WHERE c.id = choice_id AND a.user_id = auth.uid() AND a.status = 'completed'
    ));

-- Secure RPC for the backend to check answer without RLS restrictions
CREATE OR REPLACE FUNCTION public.check_choice_correctness(p_choice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_correct BOOLEAN;
BEGIN
    SELECT is_correct INTO v_is_correct
    FROM public.learning_choice_corrections
    WHERE choice_id = p_choice_id;
    
    RETURN v_is_correct;
END;
$$;


-- ==============================================================================
-- 2. M08 EXAM SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_exercise_id UUID NOT NULL REFERENCES public.learning_exercises(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'submitted', 'expired', 'abandoned')),
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. M08 EXAM QUESTIONS (Fixed selection and order)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    learning_question_id UUID NOT NULL REFERENCES public.learning_questions(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL,
    UNIQUE(exam_session_id, learning_question_id),
    UNIQUE(exam_session_id, order_index)
);

-- ==============================================================================
-- 4. M08 EXAM ATTEMPTS (Link to M04 Learning Engine)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    learning_attempt_id UUID NOT NULL REFERENCES public.learning_attempts(id) ON DELETE CASCADE,
    UNIQUE(exam_session_id),
    UNIQUE(learning_attempt_id)
);

-- ==============================================================================
-- 5. INDEXES & RLS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_session_id ON public.exam_questions(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_session_id ON public.exam_attempts(exam_session_id);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_sessions_select" ON public.exam_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "exam_sessions_insert" ON public.exam_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "exam_sessions_update" ON public.exam_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "exam_sessions_delete" ON public.exam_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "exam_questions_select" ON public.exam_questions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
);
CREATE POLICY "exam_questions_insert" ON public.exam_questions FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
);

CREATE POLICY "exam_attempts_select" ON public.exam_attempts FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
);
CREATE POLICY "exam_attempts_insert" ON public.exam_attempts FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
);

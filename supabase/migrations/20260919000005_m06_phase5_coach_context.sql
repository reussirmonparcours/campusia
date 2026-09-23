-- ==============================================================================
-- Migration: 20260919000005_m06_phase5_coach_context.sql
-- Milestone 06 — Phase 5: Coach Context Restoration (Schema Update)
-- ==============================================================================

-- 1. Add context columns to ai_sessions
ALTER TABLE public.ai_sessions 
ADD COLUMN attempt_id UUID NULL REFERENCES public.learning_attempts(id) ON DELETE CASCADE,
ADD COLUMN question_id UUID NULL REFERENCES public.learning_questions(id) ON DELETE CASCADE;

-- 2. Create Unique Constraint for Coach mode
-- One user can have exactly ONE coach session for a specific question within a specific attempt.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_sessions_coach_context 
ON public.ai_sessions (user_id, attempt_id, question_id) 
WHERE mode = 'coach';

-- Index for fast lookup by context
CREATE INDEX IF NOT EXISTS idx_ai_sessions_attempt_id ON public.ai_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_question_id ON public.ai_sessions(question_id);

-- 3. Enhance RLS Policies for ai_sessions
-- Drop old policies to replace them with stronger ones.
DROP POLICY IF EXISTS "ai_sessions_insert" ON public.ai_sessions;
DROP POLICY IF EXISTS "ai_sessions_update" ON public.ai_sessions;

-- Recreate INSERT policy
CREATE POLICY "ai_sessions_insert" ON public.ai_sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        (
            subject_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.subjects s 
                WHERE s.id = subject_id 
                AND (s.created_by IS NULL OR s.created_by = auth.uid())
            )
        ) AND
        (
            mode != 'coach' OR (
                attempt_id IS NOT NULL AND
                question_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM public.learning_attempts la
                    JOIN public.learning_questions lq ON la.exercise_id = lq.exercise_id
                    WHERE la.id = attempt_id 
                      AND la.user_id = auth.uid() 
                      AND lq.id = question_id
                )
            )
        )
    );

-- Recreate UPDATE policy
CREATE POLICY "ai_sessions_update" ON public.ai_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        (
            subject_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.subjects s 
                WHERE s.id = subject_id 
                AND (s.created_by IS NULL OR s.created_by = auth.uid())
            )
        ) AND
        (
            mode != 'coach' OR (
                attempt_id IS NOT NULL AND
                question_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM public.learning_attempts la
                    JOIN public.learning_questions lq ON la.exercise_id = lq.exercise_id
                    WHERE la.id = attempt_id 
                      AND la.user_id = auth.uid() 
                      AND lq.id = question_id
                )
            )
        )
    );

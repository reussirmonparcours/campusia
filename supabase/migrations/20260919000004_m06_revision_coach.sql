-- ==============================================================================
-- Migration: 20260919000004_m06_revision_coach.sql
-- Milestone 06 — Revision & Coach (Data Model & RLS)
-- ==============================================================================

-- 1. REVISION SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.revision_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    learning_exercise_id UUID NOT NULL REFERENCES public.learning_exercises(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 2. REVISION ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.revision_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_session_id UUID NOT NULL REFERENCES public.revision_sessions(id) ON DELETE CASCADE,
    learning_attempt_id UUID NOT NULL REFERENCES public.learning_attempts(id) ON DELETE CASCADE,
    order_index INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(revision_session_id, learning_attempt_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_revision_sessions_user_id ON public.revision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_subject_id ON public.revision_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_learning_exercise_id ON public.revision_sessions(learning_exercise_id);
CREATE INDEX IF NOT EXISTS idx_revision_attempts_revision_session_id ON public.revision_attempts(revision_session_id);
CREATE INDEX IF NOT EXISTS idx_revision_attempts_learning_attempt_id ON public.revision_attempts(learning_attempt_id);

-- 4. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_attempts ENABLE ROW LEVEL SECURITY;

-- Permissions for revision_sessions
-- User can SELECT their own sessions
CREATE POLICY "revision_sessions_select" ON public.revision_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- User can INSERT their own sessions
CREATE POLICY "revision_sessions_insert" ON public.revision_sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.learning_exercises e
            WHERE e.id = learning_exercise_id
              AND e.subject_id = revision_sessions.subject_id
        ) AND
        EXISTS (
            SELECT 1 FROM public.subjects s
            WHERE s.id = subject_id
        )
    );

-- User can UPDATE their own sessions
CREATE POLICY "revision_sessions_update" ON public.revision_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.learning_exercises e
            WHERE e.id = learning_exercise_id
              AND e.subject_id = revision_sessions.subject_id
        )
    );

-- User can DELETE their own sessions
CREATE POLICY "revision_sessions_delete" ON public.revision_sessions
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());


-- Permissions for revision_attempts
-- User can SELECT attempts linked to their sessions
CREATE POLICY "revision_attempts_select" ON public.revision_attempts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.revision_sessions rs
            WHERE rs.id = revision_session_id AND rs.user_id = auth.uid()
        )
    );

-- User can INSERT attempts linked to their sessions, ensuring attempt ownership and exercise match
CREATE POLICY "revision_attempts_insert" ON public.revision_attempts
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.revision_sessions rs
            JOIN public.learning_attempts la ON la.id = revision_attempts.learning_attempt_id
            WHERE rs.id = revision_attempts.revision_session_id 
              AND rs.user_id = auth.uid()
              AND la.user_id = auth.uid()
              AND la.exercise_id = rs.learning_exercise_id
        )
    );

-- User can UPDATE attempts linked to their sessions
CREATE POLICY "revision_attempts_update" ON public.revision_attempts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.revision_sessions rs
            WHERE rs.id = revision_session_id AND rs.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.revision_sessions rs
            JOIN public.learning_attempts la ON la.id = revision_attempts.learning_attempt_id
            WHERE rs.id = revision_attempts.revision_session_id 
              AND rs.user_id = auth.uid()
              AND la.user_id = auth.uid()
              AND la.exercise_id = rs.learning_exercise_id
        )
    );

-- User can DELETE attempts linked to their sessions
CREATE POLICY "revision_attempts_delete" ON public.revision_attempts
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.revision_sessions rs
            WHERE rs.id = revision_session_id AND rs.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- Migration: 20260919000003_m05_ai_interface.sql
-- Milestone 05 — AI Interface (Sessions, Messages)
-- ==============================================================================

-- 1. AI SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('explain', 'summarize', 'quiz', 'coach')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. AI MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources_used JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
-- Indexing user_id is crucial for RLS and listing a user's sessions.
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON public.ai_sessions(user_id);
-- Indexing subject_id is useful for FK constraints and subject-level stats later.
CREATE INDEX IF NOT EXISTS idx_ai_sessions_subject_id ON public.ai_sessions(subject_id);
-- Indexing session_id is mandatory to quickly fetch messages belonging to a chat session.
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON public.ai_messages(session_id);

-- 4. RLS & SECURITY
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;

-- Policies for ai_sessions

-- SELECT: owner only
CREATE POLICY "ai_sessions_select" ON public.ai_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- INSERT: owner only + Subject security
-- Subject security check:
-- subject_id IS NULL OR subject is official (created_by IS NULL) OR subject belongs to user (created_by = auth.uid())
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
        )
    );

-- UPDATE: owner only + Subject security
-- Prevent transferring session to another user (user_id = auth.uid() via WITH CHECK)
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
        )
    );

-- DELETE: owner only
CREATE POLICY "ai_sessions_delete" ON public.ai_sessions
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());


-- Policies for ai_messages

-- SELECT: Only if session belongs to user
CREATE POLICY "ai_messages_select" ON public.ai_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

-- INSERT: Only if session belongs to user
CREATE POLICY "ai_messages_insert" ON public.ai_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

-- UPDATE & DELETE are purposely OMITTED (prohibited) as per requirements.

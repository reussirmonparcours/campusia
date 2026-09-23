-- ==============================================================================
-- Migration: 20260922000004_m10_7_memory_architecture.sql
-- Milestone 10.7 — Learner Memory & Conversation Continuity
-- ==============================================================================

-- 1. EXTEND AI SESSIONS
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS summary TEXT;

-- 2. LEARNER MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.learner_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('preference', 'goal', 'difficulty', 'fact')),
    content TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('conversation', 'activity', 'exercise', 'revision', 'document')),
    source_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_learner_memory_user_id ON public.learner_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_memory_active ON public.learner_memory(user_id) WHERE is_active = true;

-- 4. RLS & SECURITY
ALTER TABLE public.learner_memory ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_memory TO authenticated;

-- Policies for learner_memory

-- SELECT: owner only
CREATE POLICY "learner_memory_select" ON public.learner_memory
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- INSERT: owner only
CREATE POLICY "learner_memory_insert" ON public.learner_memory
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE: owner only
CREATE POLICY "learner_memory_update" ON public.learner_memory
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: owner only
CREATE POLICY "learner_memory_delete" ON public.learner_memory
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

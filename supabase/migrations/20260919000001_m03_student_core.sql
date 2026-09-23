-- ==============================================================================
-- Migration: 20260919000001_m03_student_core.sql
-- Milestone 03 — Student Experience Core (Objectives & Activities)
-- ==============================================================================

-- 1. STUDENT OBJECTIVES TABLE
CREATE TABLE IF NOT EXISTS public.student_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    objective_type TEXT NOT NULL CHECK (objective_type IN ('subject', 'revision', 'progression', 'general')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
    target_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STUDENT ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    provenance TEXT NOT NULL DEFAULT 'manual',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_student_objectives_user_id ON public.student_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_student_objectives_subject_id ON public.student_objectives(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_objectives_status ON public.student_objectives(status);

CREATE INDEX IF NOT EXISTS idx_student_activities_user_id ON public.student_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_subject_id ON public.student_activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_created_at ON public.student_activities(created_at DESC);

-- 4. RLS & SECURITY
ALTER TABLE public.student_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_objectives TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_activities TO authenticated;

-- Policies for student_objectives
CREATE POLICY "objectives_select_own" ON public.student_objectives
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "objectives_delete_own" ON public.student_objectives
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "objectives_insert_own" ON public.student_objectives
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        (subject_id IS NULL OR EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid())
        ))
    );

CREATE POLICY "objectives_update_own" ON public.student_objectives
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (subject_id IS NULL OR EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid())
        ))
    );

-- Policies for student_activities
CREATE POLICY "activities_select_own" ON public.student_activities
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "activities_delete_own" ON public.student_activities
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_own" ON public.student_activities
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        (subject_id IS NULL OR EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid())
        ))
    );

CREATE POLICY "activities_update_own" ON public.student_activities
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (subject_id IS NULL OR EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid())
        ))
    );

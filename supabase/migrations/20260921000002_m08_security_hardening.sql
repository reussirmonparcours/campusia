-- ==============================================================================
-- Migration: 20260921000002_m08_security_hardening.sql
-- Milestone 08.2 — Security Hardening
-- ==============================================================================

-- 1. DROP the insecure SECURITY DEFINER RPC
-- It was accessible to authenticated users, acting as an oracle.
DROP FUNCTION IF EXISTS public.check_choice_correctness(UUID);

-- 2. Stricter RLS for corrections_select_completed_attempt
-- Ensure the completed attempt strictly belongs to the exact exercise of the question.
-- (The previous policy was correct, but we DROP and recreate to ensure it's exact)
DROP POLICY IF EXISTS "corrections_select_completed_attempt" ON public.learning_choice_corrections;
CREATE POLICY "corrections_select_completed_attempt" ON public.learning_choice_corrections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.learning_choices c
        JOIN public.learning_questions q ON q.id = c.question_id
        JOIN public.learning_attempts a ON a.exercise_id = q.exercise_id
        WHERE c.id = choice_id AND a.user_id = auth.uid() AND a.status = 'completed'
    ));

-- Note: The server will now use supabaseAdmin (Service Role) to query learning_choice_corrections directly
-- bypassing RLS entirely, rather than relying on an RPC.

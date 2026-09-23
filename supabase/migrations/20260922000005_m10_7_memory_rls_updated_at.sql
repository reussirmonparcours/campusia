-- ==============================================================================
-- Migration: 20260922000005_m10_7_memory_rls_updated_at.sql
-- Milestone 10.7 — Phase 1.1 Corrections
-- ==============================================================================

-- 1. DROP CLIENT INSERT/UPDATE POLICIES
-- The client browser (authenticated role) MUST NOT be able to insert or update memory directly.
-- This restricts writes to the server backend only (e.g. using service_role).
DROP POLICY IF EXISTS "learner_memory_insert" ON public.learner_memory;
DROP POLICY IF EXISTS "learner_memory_update" ON public.learner_memory;

-- 2. ADD UPDATED_AT TRIGGER
-- Reusing the existing function 'update_updated_at_column' created in M10.
DROP TRIGGER IF EXISTS update_learner_memory_updated_at ON public.learner_memory;

CREATE TRIGGER update_learner_memory_updated_at
    BEFORE UPDATE ON public.learner_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Test: 02_student_subject_progress_rls.sql
-- Validation des politiques RLS sur public.student_subject_progress
-- ==============================================================================

BEGIN;

-- 1. Configuration préliminaire (matière de test)
INSERT INTO public.subjects (id, code, name, credits)
VALUES ('99999999-9999-9999-9999-999999999999', 'TEST-ECO-01', 'Économie de Test', 4)
ON CONFLICT (code) DO NOTHING;

-- 2. Contexte User A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- 3. Test 1 : User A insère sa propre progression
INSERT INTO public.student_subject_progress (user_id, subject_id, learning_status, is_flagged_difficult)
VALUES ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'en_cours', false);

-- 4. Test 2 : User A bascule sa progression en "comprise" et signale difficile
UPDATE public.student_subject_progress
SET learning_status = 'comprise', is_flagged_difficult = true
WHERE subject_id = '99999999-9999-9999-9999-999999999999';

-- 5. Basculer vers User B
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- 6. Test 3 : User B ne voit aucune ligne de progression de User A
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM public.student_subject_progress
    WHERE user_id = '11111111-1111-1111-1111-111111111111';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'RLS Failure: User B can see User A subject progress';
    END IF;
END $$;

-- 7. Test 4 : User B ne peut pas modifier la progression de User A
UPDATE public.student_subject_progress
SET learning_status = 'maitrisee'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    v_status TEXT;
BEGIN
    SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
    SELECT learning_status INTO v_status FROM public.student_subject_progress
    WHERE user_id = '11111111-1111-1111-1111-111111111111'
      AND subject_id = '99999999-9999-9999-9999-999999999999';
    IF v_status <> 'comprise' THEN
        RAISE EXCEPTION 'RLS Failure: User B modified User A progress status';
    END IF;
END $$;

ROLLBACK;

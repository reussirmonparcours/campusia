-- ==============================================================================
-- Test: 01_student_profiles_rls.sql
-- Validation des politiques RLS sur public.student_profiles
-- ==============================================================================

BEGIN;

-- 1. Configuration des rôles simulés (User A et User B)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- 2. Test 1 : User A peut insérer son propre profil
INSERT INTO public.student_profiles (user_id, first_name, last_name, display_name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Kodjo', 'Agbéyomé', 'Kodjo A.');

-- 3. Test 2 : User A peut lire son propre profil
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM public.student_profiles
    WHERE user_id = '11111111-1111-1111-1111-111111111111';
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'RLS Failure: User A cannot read own profile';
    END IF;
END $$;

-- 4. Test 3 : User A ne peut PAS insérer le profil de User B (doit échouer)
DO $$
BEGIN
    INSERT INTO public.student_profiles (user_id, first_name, last_name)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Afiwa', 'Mensah');
    RAISE EXCEPTION 'RLS Failure: User A was able to insert profile for User B';
EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
        -- Attendu : rejet par RLS WITH CHECK
        NULL;
END $$;

-- 5. Basculer vers User B
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- 6. Test 4 : User B ne doit PAS voir le profil de User A (0 ligne retournée)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM public.student_profiles
    WHERE user_id = '11111111-1111-1111-1111-111111111111';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'RLS Failure: User B can read User A profile';
    END IF;
END $$;

-- 7. Test 5 : User B ne peut PAS modifier le profil de User A
UPDATE public.student_profiles
SET first_name = 'Hacked'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    v_name TEXT;
BEGIN
    -- Vérification en revenant à User A
    SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
    SELECT first_name INTO v_name FROM public.student_profiles
    WHERE user_id = '11111111-1111-1111-1111-111111111111';
    IF v_name <> 'Kodjo' THEN
        RAISE EXCEPTION 'RLS Failure: User B modified User A profile';
    END IF;
END $$;

ROLLBACK;

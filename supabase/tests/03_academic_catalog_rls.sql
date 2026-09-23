-- ==============================================================================
-- Test: 03_academic_catalog_rls.sql
-- Validation de la lecture seule pour les étudiants sur le catalogue académique
-- ==============================================================================

BEGIN;

-- Contexte étudiant authentifié
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- 1. Test 1 : Lecture autorisée
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM public.universities;
    -- Ne doit pas lever d'erreur de permission
END $$;

-- 2. Test 2 : Tentative d'INSERT sur universities (doit être refusée)
DO $$
BEGIN
    INSERT INTO public.universities (name, code, country)
    VALUES ('Université Malveillante', 'MAL', 'Togo');
    RAISE EXCEPTION 'Security Failure: Student was able to insert an university';
EXCEPTION
    WHEN insufficient_privilege THEN
        NULL; -- Succès : privilège refusé
END $$;

-- 3. Test 3 : Tentative d'UPDATE sur faculties (doit être refusée)
DO $$
BEGIN
    UPDATE public.faculties SET name = 'Faculté Altérée';
    RAISE EXCEPTION 'Security Failure: Student was able to update a faculty';
EXCEPTION
    WHEN insufficient_privilege THEN
        NULL; -- Succès : privilège refusé
END $$;

-- 4. Test 4 : Tentative de DELETE sur subjects (doit être refusée)
DO $$
BEGIN
    DELETE FROM public.subjects;
    RAISE EXCEPTION 'Security Failure: Student was able to delete subjects';
EXCEPTION
    WHEN insufficient_privilege THEN
        NULL; -- Succès : privilège refusé
END $$;

ROLLBACK;

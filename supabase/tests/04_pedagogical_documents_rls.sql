-- ==============================================================================
-- Test: 04_pedagogical_documents_rls.sql
-- Validation des politiques RLS sur pedagogical_documents
-- ==============================================================================

BEGIN;

-- Contexte User A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- 1. Test 1 : User A insère un document privé valide
INSERT INTO public.pedagogical_documents (
    id, uploader_id, title, storage_path, doc_type, is_official, visibility
) VALUES (
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    'Notes personnelles Microéconomie',
    '11111111-1111-1111-1111-111111111111/micro.pdf',
    'synthese',
    false,
    'private'
);

-- 2. Test 2 : User A tente de créer un document "officiel" (doit être refusé)
DO $$
BEGIN
    INSERT INTO public.pedagogical_documents (
        uploader_id, title, storage_path, doc_type, is_official, visibility
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Faux Syllabus Officiel',
        'institutional/fake.pdf',
        'cours',
        true,
        'institutional'
    );
    RAISE EXCEPTION 'Security Failure: Student was able to insert official document';
EXCEPTION
    WHEN check_violation OR insufficient_privilege THEN
        NULL; -- Succès : rejeté par contrainte CHECK ou RLS WITH CHECK
END $$;

-- 3. Basculer vers User B
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- 4. Test 3 : User B ne doit pas voir le document privé de User A
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM public.pedagogical_documents
    WHERE id = '88888888-8888-8888-8888-888888888881';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'RLS Failure: User B can view User A private document';
    END IF;
END $$;

ROLLBACK;

-- ==============================================================================
-- Test: 05_storage_rls.sql
-- Validation des politiques RLS sur storage.objects (bucket pedagogical-documents)
-- ==============================================================================

BEGIN;

-- Contexte User A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- 1. Test 1 : User A insère un objet dans son dossier personnel
INSERT INTO storage.objects (
    id, bucket_id, name, owner, metadata
) VALUES (
    '77777777-7777-7777-7777-777777777771',
    'pedagogical-documents',
    '11111111-1111-1111-1111-111111111111/cours1.pdf',
    '11111111-1111-1111-1111-111111111111',
    '{"mimetype": "application/pdf"}'::jsonb
);

-- 2. Test 2 : User A tente d'écrire dans le dossier de User B (doit échouer)
DO $$
BEGIN
    INSERT INTO storage.objects (
        id, bucket_id, name, owner, metadata
    ) VALUES (
        '77777777-7777-7777-7777-777777777772',
        'pedagogical-documents',
        '22222222-2222-2222-2222-222222222222/malicious.pdf',
        '11111111-1111-1111-1111-111111111111',
        '{"mimetype": "application/pdf"}'::jsonb
    );
    RAISE EXCEPTION 'Storage Failure: User A wrote into User B folder';
EXCEPTION
    WHEN check_violation OR insufficient_privilege THEN
        NULL; -- Succès : rejeté par RLS WITH CHECK
END $$;

-- 3. Basculer vers User B
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- 4. Test 3 : User B ne peut pas lire le fichier privé de User A
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM storage.objects
    WHERE bucket_id = 'pedagogical-documents'
      AND name = '11111111-1111-1111-1111-111111111111/cours1.pdf';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'Storage Failure: User B can read User A storage object';
    END IF;
END $$;

ROLLBACK;

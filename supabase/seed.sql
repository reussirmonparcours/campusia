-- ==============================================================================
-- Seed Data: MonParcours Milestone 02 Initial Base
-- Ground Truth: Université de Lomé -> FASEG -> Tronc Commun Licence S1 & S2
-- ==============================================================================

-- 1. INSTITUTION (UNIVERSITÉ DE LOMÉ)
INSERT INTO public.institutions (id, name, type, code, country)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Université de Lomé',
    'university',
    'UL',
    'Togo'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    country = EXCLUDED.country;

-- 2. ACADEMIC UNIT (FASEG)
INSERT INTO public.academic_units (id, institution_id, name, type, code)
VALUES (
    'b2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Faculté des Sciences Économiques et de Gestion',
    'faculty',
    'FASEG'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    institution_id = EXCLUDED.institution_id,
    type = EXCLUDED.type;

-- 3. PROGRAMME (FILIÈRE / MENTION)
INSERT INTO public.programs (id, academic_unit_id, name, cycle)
VALUES (
    'c3000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000001',
    'Sciences Économiques et de Gestion',
    'Licence'
)
ON CONFLICT (id) DO NOTHING;

-- 4. PARCOURS (SPÉCIALITÉS L3 - OPTIONNELS EN L1/L2)
INSERT INTO public.tracks (id, program_id, name, code)
VALUES 
    ('d4000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001', 'Analyse et Politique Économiques', 'APE'),
    ('d4000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000001', 'Économie du Développement', 'ED'),
    ('d4000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000001', 'Économie Internationale', 'EI'),
    ('d4000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000001', 'Comptabilité Contrôle Audit', 'CCA'),
    ('d4000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000001', 'Marketing et Stratégie', 'M&S'),
    ('d4000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000001', 'Organisation et Gestion des Ressources Humaines', 'OGRH')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    program_id = EXCLUDED.program_id;

-- 5. SEMESTRES STRUCTURELS (S1 & S2 DU PROGRAMME)
INSERT INTO public.semesters (id, program_id, semester_number, total_credits)
VALUES 
    (
        'e5000000-0000-0000-0000-000000000001',
        'c3000000-0000-0000-0000-000000000001',
        1,
        30
    ),
    (
        'e5000000-0000-0000-0000-000000000002',
        'c3000000-0000-0000-0000-000000000001',
        2,
        30
    )
ON CONFLICT (program_id, semester_number) DO UPDATE SET
    total_credits = EXCLUDED.total_credits;

-- 6. DUMMY SUBJECT FOR LEARNING DEMO
INSERT INTO public.subjects (id, semester_id, name, code, description, credits, is_mandatory)
VALUES (
    'f6000000-0000-0000-0000-000000000001',
    'e5000000-0000-0000-0000-000000000001',
    'Bases de la Microéconomie (Démo)',
    'ECO101',
    'Introduction aux concepts fondamentaux de la microéconomie.',
    3,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 7. LEARNING EXERCISE DEMO
INSERT INTO public.learning_exercises (id, subject_id, title, description, exercise_type, difficulty, created_by)
VALUES (
    'a7000000-0000-0000-0000-000000000001',
    'f6000000-0000-0000-0000-000000000001',
    'Quiz: Les bases de l''offre et la demande',
    'Testez vos connaissances sur les concepts fondamentaux de l''offre et la demande. [DEMO CONTENT]',
    'quiz',
    'easy',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 8. LEARNING QUESTIONS & CHOICES
-- Question 1: QCM Unique
INSERT INTO public.learning_questions (id, exercise_id, question_type, content, explanation, order_index, difficulty)
VALUES (
    'b8000000-0000-0000-0000-000000000001',
    'a7000000-0000-0000-0000-000000000001',
    'single_choice',
    'Que se passe-t-il généralement lorsque le prix d''un bien augmente, toutes choses égales par ailleurs ?',
    'La loi de la demande stipule que la quantité demandée d''un bien diminue lorsque son prix augmente.',
    1,
    'easy'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_choices (id, question_id, content, is_correct, explanation)
VALUES 
    ('c9000000-0000-0000-0000-000000000001', 'b8000000-0000-0000-0000-000000000001', 'La quantité demandée augmente', false, 'Faux, c''est l''inverse.'),
    ('c9000000-0000-0000-0000-000000000002', 'b8000000-0000-0000-0000-000000000001', 'La quantité demandée diminue', true, 'C''est la loi fondamentale de la demande.'),
    ('c9000000-0000-0000-0000-000000000003', 'b8000000-0000-0000-0000-000000000001', 'L''offre diminue', false, 'Le prix influence l''offre dans le même sens, pas l''inverse.'),
    ('c9000000-0000-0000-0000-000000000004', 'b8000000-0000-0000-0000-000000000001', 'Rien ne change', false, 'Le prix est un déterminant de la demande.')
ON CONFLICT (id) DO NOTHING;

-- Question 2: Réponse Libre
INSERT INTO public.learning_questions (id, exercise_id, question_type, content, explanation, order_index, difficulty)
VALUES (
    'b8000000-0000-0000-0000-000000000002',
    'a7000000-0000-0000-0000-000000000001',
    'free_text',
    'Expliquez brièvement le concept d''élasticité-prix de la demande.',
    'L''élasticité-prix mesure la sensibilité de la quantité demandée suite à une variation du prix.',
    2,
    'medium'
)
ON CONFLICT (id) DO NOTHING;

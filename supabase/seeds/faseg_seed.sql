-- ==============================================================================
-- FASEG ACADEMIC SEED (PAUL 2026-2027)
-- ==============================================================================

DO $$
DECLARE
    v_institution_id UUID;
    v_unit_id UUID;
    
    v_prog_eco_id UUID;
    v_prog_gest_id UUID;
    
    v_track_ape_id UUID;
    v_track_ed_id UUID;
    v_track_ei_id UUID;
    v_track_cca_id UUID;
    v_track_ms_id UUID;
    v_track_ogrh_id UUID;
    
    v_sem_eco_1 UUID; v_sem_eco_2 UUID; v_sem_eco_3 UUID; v_sem_eco_4 UUID; v_sem_eco_5 UUID; v_sem_eco_6 UUID;
    v_sem_gest_1 UUID; v_sem_gest_2 UUID; v_sem_gest_3 UUID; v_sem_gest_4 UUID; v_sem_gest_5 UUID; v_sem_gest_6 UUID;
    
    v_subj_id UUID;
BEGIN

    -- 1. Institution
    INSERT INTO public.institutions (name, type, code, country)
    VALUES ('Université de Lomé', 'university', 'UL', 'Togo')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_institution_id;

    -- 2. Academic Unit
    INSERT INTO public.academic_units (institution_id, name, type, code)
    VALUES (v_institution_id, 'Faculté des Sciences Économiques et de Gestion', 'faculty', 'FASEG')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_unit_id;

    -- 3. Programs
    INSERT INTO public.programs (academic_unit_id, name, cycle)
    VALUES (v_unit_id, 'Sciences Économiques', 'Licence')
    RETURNING id INTO v_prog_eco_id;
    
    INSERT INTO public.programs (academic_unit_id, name, cycle)
    VALUES (v_unit_id, 'Gestion', 'Licence')
    RETURNING id INTO v_prog_gest_id;

    -- 4. Tracks
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_eco_id, 'Analyse et Politique Économique', 'APE') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_ape_id;
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_eco_id, 'Économie du Développement', 'ED') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_ed_id;
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_eco_id, 'Économie Internationale', 'EI') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_ei_id;
    
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_gest_id, 'Comptabilité, Contrôle, Audit', 'CCA') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_cca_id;
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_gest_id, 'Marketing et Stratégie', 'M&S') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_ms_id;
    INSERT INTO public.tracks (program_id, name, code) VALUES (v_prog_gest_id, 'Organisation et Gestion des Ressources Humaines', 'OGRH') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_track_ogrh_id;

    -- 5. Semesters
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 1, 31) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_1;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 2, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_2;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 3, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_3;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 4, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_4;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 5, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_5;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 6, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_6;

    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 1, 31) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_1;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 2, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_2;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 3, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_3;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 4, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_4;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 5, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_5;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 6, 30) ON CONFLICT ON CONSTRAINT unique_program_semester DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_6;


    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT100C', 'Comptabilité de base', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO100C', 'Introduction à l’économie', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO101C', 'Principes de base de la microéconomie', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO102C', 'Principes de base de la macroéconomie', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO103C', 'Analyse mathématique', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO104C', 'Statistique descriptive', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO205C', 'Histoire des faits économiques et sociaux', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT200C', 'Comptabilité des opérations courantes', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO201C', 'Équilibre partiel en microéconomie', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO202C', 'Modèles de base de la macroéconomie', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO203C', 'Algèbre linéaire', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO204C', 'Séries chronologiques de base', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX1C', 'Introduction au droit privé', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO301C', 'Analyse microéconomique', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO303C', 'Équations différentielles', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO304C', 'Calcul des probabilités', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO310C', 'Principes de finances publiques', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO330C', 'Économie monétaire', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX2C', 'Droit du travail et des contrats', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO206C', 'Introduction à la comptabilité nationale', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO312C', 'Statistique décisionnelle', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO350C', 'Introduction à l''économie du développement', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO427C', 'Technique de planification économique', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO429C', 'Finances publiques', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ANGX1C', 'Anglais économique élémentaire', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO305C', 'Introduction à l''économie publique', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO306C', 'Comptabilité nationale', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO315C', 'Informatique de base', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO413C', 'Histoire de la pensée économique', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO423C', 'Recherche opérationnelle', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO440C', 'Économie internationale', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ANGX2C', 'Anglais économique intermédiaire', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO307C', 'Introduction à la méthodologie de la recherche', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO311C', 'Étude de projets', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO322C', 'Économétrie', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO323C', 'Informatique pour économiste', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO412C', 'Fluctuations et croissance', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO421C', 'Économie publique intermédiaire', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO313C', 'Démographie', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO451C', 'Théories du développement', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRPX3C', 'Droit des conventions internationales', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO442C', 'Économie monétaire internationale', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ECO441C', 'Commerce international', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT300C', 'Comptabilité des travaux de fin d''exercice', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('FIN200C', 'Mathématiques financières', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT200C', 'Économie d''entreprise', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT400C', 'Comptabilité analytique de gestion', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT402C', 'Comptabilité des sociétés', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX5C', 'Introduction à la fiscalité', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ANGG1C', 'Anglais élémentaire de gestion', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX4C', 'Introduction au droit des affaires', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('FIN300C', 'Analyse financière', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT311C', 'Initiation à l''évaluation des projets', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT403C', 'Gestion prévisionnelle', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('ANGG2C', 'Anglais intermédiaire de gestion', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('CPT409C', 'Logiciel comptable', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('FIN301C', 'Gestion de la trésorerie', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT401C', 'Introduction au contrôle de gestion', 5, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT407C', 'Introduction à l''audit', 4, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX9C', 'Droit commercial', 3, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT300C', 'Principes de marketing', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT404C', 'Introduction à la stratégie d''entreprise', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT406C', 'Gestion prévisionnelle des ventes', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT400C', 'Communication-publicité', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT405C', 'Technique de vente et négociation', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT301C', 'Introduction à l''étude de marché', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT401C', 'Politique générale d''entreprise', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MKT409C', 'Logiciel de gestion commerciale', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX6C', 'Droit du travail', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX7C', 'Négociation syndicat-patronat', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT300C', 'Système d''information de gestion', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT400C', 'Introduction à la gestion des ressources humaines', 7, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX3C', 'Sécurité sociale', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT301C', 'Sociologie des organisations', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT309C', 'Introduction au management', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('DRVX8C', 'Lois sociales et relations du travail', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT402C', 'Introduction à la théorie des organisations', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('MGT409C', 'Logiciel de gestion des ressources humaines', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('PHIX1C', 'Psychologie du travail', 6, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT100C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO100C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO101C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO102C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO103C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO104C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO205C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO201C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO202C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO203C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO204C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO303C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO304C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO330C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO206C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO312C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO350C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO427C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO429C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO305C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO306C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO413C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO423C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO440C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO307C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO322C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO323C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO412C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO421C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ape_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO303C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO304C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO330C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO206C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO312C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO313C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO350C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO427C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO429C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO305C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO306C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO413C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO423C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO440C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO307C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO322C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO323C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO412C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO451C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ed_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO303C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO304C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO330C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_3, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRPX3C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO206C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO312C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO350C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO429C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_4, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO305C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO306C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO413C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO423C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO442C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_5, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO307C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO322C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO323C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO412C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO441C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_6, v_subj_id, v_track_ei_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO304C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'FIN200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT400C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT402C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX5C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO206C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO312C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX4C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO423C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'FIN300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT403C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT409C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO322C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'FIN301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT401C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT407C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_cca_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO304C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'FIN200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT400C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX5C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX9C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT404C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX4C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT406C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT400C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT405C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT401C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MKT409C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ms_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'CPT300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX6C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO310C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'FIN200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT200C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_3, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX5C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX7C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT300C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT400C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_4, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX3C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX4C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ECO315C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT301C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT309C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT311C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_5, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'ANGG2C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'DRVX8C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT402C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'MGT409C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

    SELECT id INTO v_subj_id FROM public.subjects WHERE code = 'PHIX1C' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_6, v_subj_id, v_track_ogrh_id) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;

END $$;

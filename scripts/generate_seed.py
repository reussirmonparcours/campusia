import re

with open('docs/FASEG_PAUL_2026_2027_REFERENCE.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_track = None
current_semester = None
subjects = {}
track_semesters = []
common_s1 = []
common_s2 = []

track_map = {
    "Analyse et Politique Économique (APE)": ("APE", "Sciences Économiques"),
    "Économie du Développement": ("ED", "Sciences Économiques"),
    "Économie Internationale": ("EI", "Sciences Économiques"),
    "Comptabilité, Contrôle, Audit (CCA)": ("CCA", "Gestion"),
    "Marketing et Stratégie": ("M&S", "Gestion"),
    "Organisation et Gestion des Ressources Humaines (OGRH)": ("OGRH", "Gestion"),
}

track_data = {
    "APE": {}, "ED": {}, "EI": {}, "CCA": {}, "M&S": {}, "OGRH": {}
}

# Parsing
mode = "common"
for line in lines:
    line = line.strip()
    if line.startswith("# 1. Tronc commun — S1"):
        mode = "common_s1"
    elif line.startswith("# 2. Tronc commun — S2"):
        mode = "common_s2"
    elif line.startswith("# 3. Licence — "):
        mode = "APE"
    elif line.startswith("# 4. Licence — "):
        mode = "ED"
    elif line.startswith("# 5. Licence — "):
        mode = "EI"
    elif line.startswith("# 6. Licence — "):
        mode = "CCA"
    elif line.startswith("# 7. Licence — "):
        mode = "M&S"
    elif line.startswith("# 8. Licence — "):
        mode = "OGRH"
    
    if line.startswith("### S") or line.startswith("### Semestre"):
        m = re.search(r'S(?:emestre\s*)?(\d)', line)
        if m:
            current_semester = int(m.group(1))
    
    if line.startswith("|") and not line.startswith("| Code") and not line.startswith("| -") and not line.startswith("| #"):
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 4:
            code = parts[1].replace("**", "")
            name = parts[2]
            try:
                credits = int(parts[3])
            except:
                continue
            
            subjects[code] = {"name": name, "credits": credits}
            
            if mode == "common_s1":
                common_s1.append(code)
            elif mode == "common_s2":
                common_s2.append(code)
            elif mode in track_data:
                if current_semester not in track_data[mode]:
                    track_data[mode][current_semester] = []
                track_data[mode][current_semester].append(code)

sql = """-- ==============================================================================
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

    -- 5. Semesters (We use 30/31 credits as required by the spec, but we can just use 30 as default, or calculate it. We'll set total_credits = NULL for simplicity to avoid constraint issues if credits vary by track).
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 1, 31) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_1;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 2, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_2;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 3, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_3;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 4, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_4;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 5, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_5;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_eco_id, 6, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_eco_6;

    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 1, 31) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_1;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 2, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_2;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 3, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_3;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 4, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_4;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 5, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_5;
    INSERT INTO public.semesters (program_id, semester_number, total_credits) VALUES (v_prog_gest_id, 6, 30) ON CONFLICT (program_id, semester_number) DO UPDATE SET total_credits = EXCLUDED.total_credits RETURNING id INTO v_sem_gest_6;

    -- 6. Subjects and Program_Subjects
"""

def escape_sql(val):
    return val.replace("'", "''")

for code, data in subjects.items():
    sql += f"""
    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('{escape_sql(code)}', '{escape_sql(data["name"])}', {data["credits"]}, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;
"""

# Link common S1/S2 to both programs (track_id IS NULL means common to all tracks in program)
for code in common_s1:
    sql += f"""
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '{escape_sql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT DO NOTHING;
"""

for code in common_s2:
    sql += f"""
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '{escape_sql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT DO NOTHING;
"""

# Link specific tracks
track_vars = {
    "APE": ("v_sem_eco", "v_track_ape_id"),
    "ED": ("v_sem_eco", "v_track_ed_id"),
    "EI": ("v_sem_eco", "v_track_ei_id"),
    "CCA": ("v_sem_gest", "v_track_cca_id"),
    "M&S": ("v_sem_gest", "v_track_ms_id"),
    "OGRH": ("v_sem_gest", "v_track_ogrh_id"),
}

for track, semesters_dict in track_data.items():
    sem_prefix, track_id_var = track_vars[track]
    for sem, codes in semesters_dict.items():
        sem_var = f"{sem_prefix}_{sem}"
        for code in codes:
            sql += f"""
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '{escape_sql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES ({sem_var}, v_subj_id, {track_id_var}) ON CONFLICT DO NOTHING;
"""

sql += """
END $$;
"""

with open('supabase/seeds/faseg_seed.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print("Seed file generated successfully at supabase/seeds/faseg_seed.sql")

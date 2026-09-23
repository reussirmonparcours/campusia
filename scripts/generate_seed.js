const fs = require('fs');

const lines = fs.readFileSync('docs/FASEG_PAUL_2026_2027_REFERENCE.md', 'utf-8').split('\n');

let current_semester = null;
const subjects = {};
const common_s1 = [];
const common_s2 = [];

const track_data = {
    "APE": {}, "ED": {}, "EI": {}, "CCA": {}, "M&S": {}, "OGRH": {}
};

let mode = "common";
for (let line of lines) {
    line = line.trim();
    if (line.startsWith("# 1. Tronc commun — S1")) mode = "common_s1";
    else if (line.startsWith("# 2. Tronc commun — S2")) mode = "common_s2";
    else if (line.startsWith("# 3. Licence — ")) mode = "APE";
    else if (line.startsWith("# 4. Licence — ")) mode = "ED";
    else if (line.startsWith("# 5. Licence — ")) mode = "EI";
    else if (line.startsWith("# 6. Licence — ")) mode = "CCA";
    else if (line.startsWith("# 7. Licence — ")) mode = "M&S";
    else if (line.startsWith("# 8. Licence — ")) mode = "OGRH";
    
    if (line.startsWith("### S") || line.startsWith("### Semestre")) {
        const m = line.match(/S(?:emestre\s*)?(\d)/);
        if (m) current_semester = parseInt(m[1]);
    }
    
    if (line.startsWith("|") && !line.startsWith("| Code") && !line.startsWith("| -") && !line.startsWith("| #")) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 4) {
            const code = parts[1].replace(/\*\*/g, "");
            const name = parts[2];
            const credits = parseInt(parts[3]);
            if (isNaN(credits)) continue;
            
            subjects[code] = { name, credits };
            
            if (mode === "common_s1") common_s1.push(code);
            else if (mode === "common_s2") common_s2.push(code);
            else if (track_data[mode]) {
                if (!track_data[mode][current_semester]) track_data[mode][current_semester] = [];
                track_data[mode][current_semester].push(code);
            }
        }
    }
}

let sql = `-- ==============================================================================
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

`;

function escapeSql(val) {
    return val.replace(/'/g, "''");
}

for (const [code, data] of Object.entries(subjects)) {
    sql += `
    INSERT INTO public.subjects (code, name, credits, created_by)
    VALUES ('${escapeSql(code)}', '${escapeSql(data.name)}', ${data.credits}, NULL)
    ON CONFLICT (code) WHERE created_by IS NULL DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits;
`;
}

// Link common S1/S2 to both programs (track_id IS NULL)
for (const code of common_s1) {
    sql += `
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '${escapeSql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_1, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
`;
}

for (const code of common_s2) {
    sql += `
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '${escapeSql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_eco_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (v_sem_gest_2, v_subj_id, NULL) ON CONFLICT (semester_id, subject_id) WHERE track_id IS NULL DO NOTHING;
`;
}

const track_vars = {
    "APE": ["v_sem_eco", "v_track_ape_id"],
    "ED": ["v_sem_eco", "v_track_ed_id"],
    "EI": ["v_sem_eco", "v_track_ei_id"],
    "CCA": ["v_sem_gest", "v_track_cca_id"],
    "M&S": ["v_sem_gest", "v_track_ms_id"],
    "OGRH": ["v_sem_gest", "v_track_ogrh_id"],
};

for (const [track, semesters_dict] of Object.entries(track_data)) {
    const [sem_prefix, track_id_var] = track_vars[track];
    for (const [sem, codes] of Object.entries(semesters_dict)) {
        const sem_var = `${sem_prefix}_${sem}`;
        for (const code of codes) {
            sql += `
    SELECT id INTO v_subj_id FROM public.subjects WHERE code = '${escapeSql(code)}' AND created_by IS NULL;
    INSERT INTO public.program_subjects (semester_id, subject_id, track_id) VALUES (${sem_var}, v_subj_id, ${track_id_var}) ON CONFLICT (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL DO NOTHING;
`;
        }
    }
}

sql += `
END $$;
`;

fs.writeFileSync('supabase/seeds/faseg_seed.sql', sql);
console.log('Seed generated in supabase/seeds/faseg_seed.sql');

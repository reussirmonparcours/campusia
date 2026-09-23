-- ==============================================================================
-- Migration: 20260918000001_milestone02_academic_model.sql
-- Milestone 02 — Phase 2: Academic Core Model, Student Profiles, Progress & RLS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ACADEMIC CATALOG

-- 2.1 Institutions
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('university', 'school', 'institute', 'training_center', 'other')),
    code TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Academic Units (Faculties, Schools, Institutes)
CREATE TABLE IF NOT EXISTS public.academic_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('faculty', 'school', 'institute', 'department', 'other')),
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Programs (Filière / Mention)
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_unit_id UUID NOT NULL REFERENCES public.academic_units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cycle TEXT NOT NULL CHECK (cycle IN ('Licence', 'Master', 'Doctorat', 'Bachelor', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Tracks (Parcours / Spécialité)
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Semesters (Structurel par programme)
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 6),
    total_credits INTEGER CHECK (total_credits IS NULL OR (total_credits > 0 AND total_credits <= 60)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_program_semester UNIQUE (program_id, semester_number)
);

-- 2.6 Subjects (Matières / ECUE)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    credits INTEGER CHECK (credits IS NULL OR credits > 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Program Subjects (Liaison Semestre <-> Matière + Spécialité)
CREATE TABLE IF NOT EXISTS public.program_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    display_order INTEGER,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. STUDENT PROFILE & PROGRESSION

-- 3.1 Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    current_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    current_semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    custom_institution TEXT,
    custom_program TEXT,
    custom_level TEXT,
    registration_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 Student Subject Progress (Apprentissage)
CREATE TABLE IF NOT EXISTS public.student_subject_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    learning_status TEXT NOT NULL DEFAULT 'en_cours' CHECK (learning_status IN ('en_cours', 'a_reviser', 'comprise', 'maitrisee')),
    is_flagged_difficult BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_subject UNIQUE (user_id, subject_id)
);

-- 4. PEDAGOGICAL DOCUMENTS (METADATA)

CREATE TABLE IF NOT EXISTS public.pedagogical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('cours', 'td', 'annale', 'synthese', 'autre')),
    is_official BOOLEAN NOT NULL DEFAULT false,
    visibility TEXT NOT NULL CHECK (visibility IN ('private', 'institutional')),
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_official_institutional CHECK (
        (is_official = false AND visibility = 'private' AND uploader_id IS NOT NULL) OR
        (is_official = true AND visibility = 'institutional')
    )
);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_academic_units_institution_id ON public.academic_units(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_academic_unit_id ON public.programs(academic_unit_id);
CREATE INDEX IF NOT EXISTS idx_tracks_program_id ON public.tracks(program_id);
CREATE INDEX IF NOT EXISTS idx_semesters_program_id ON public.semesters(program_id);
CREATE INDEX IF NOT EXISTS idx_program_subjects_semester_id ON public.program_subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_program_subjects_subject_id ON public.program_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_program_subjects_track_id ON public.program_subjects(track_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_program_subject_track ON public.program_subjects (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_program_subject_common ON public.program_subjects (semester_id, subject_id) WHERE track_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_official_subject_code ON public.subjects(code) WHERE created_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_profiles_program_id ON public.student_profiles(program_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_track_id ON public.student_profiles(current_track_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_semester_id ON public.student_profiles(current_semester_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON public.student_subject_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_subject_id ON public.student_subject_progress(subject_id);
CREATE INDEX IF NOT EXISTS idx_pedagogical_documents_subject_id ON public.pedagogical_documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_pedagogical_documents_uploader_id ON public.pedagogical_documents(uploader_id);

-- 6. POSTGRESQL PERMISSIONS / GRANTS
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.institutions, public.academic_units, public.programs, public.tracks, public.semesters, public.program_subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles, public.student_subject_progress, public.pedagogical_documents, public.subjects TO authenticated;

-- 7. ROW LEVEL SECURITY (RLS)

-- 7.1 Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedagogical_documents ENABLE ROW LEVEL SECURITY;

-- 7.2 Academic Catalog Policies (SELECT for authenticated, no client mutations)
CREATE POLICY "catalog_institutions_read" ON public.institutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalog_academic_units_read" ON public.academic_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalog_programs_read" ON public.programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalog_tracks_read" ON public.tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalog_semesters_read" ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalog_program_subjects_read" ON public.program_subjects FOR SELECT TO authenticated USING (true);

-- 7.2.1 Subjects Policies (Read all, Mutate own)
CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT TO authenticated USING (created_by IS NULL OR auth.uid() = created_by);
CREATE POLICY "subjects_insert_own" ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "subjects_update_own" ON public.subjects FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "subjects_delete_own" ON public.subjects FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 7.3 Student Profiles Policies
CREATE POLICY "profiles_select_own" ON public.student_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.student_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.student_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.student_profiles
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7.4 Student Subject Progress Policies
CREATE POLICY "progress_select_own" ON public.student_subject_progress
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "progress_insert_own" ON public.student_subject_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update_own" ON public.student_subject_progress
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_delete_own" ON public.student_subject_progress
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7.5 Pedagogical Documents Policies
CREATE POLICY "documents_select_authorized" ON public.pedagogical_documents
    FOR SELECT TO authenticated
    USING (visibility = 'institutional' OR (visibility = 'private' AND auth.uid() = uploader_id));

CREATE POLICY "documents_insert_own" ON public.pedagogical_documents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploader_id AND is_official = false AND visibility = 'private');

CREATE POLICY "documents_update_own" ON public.pedagogical_documents
    FOR UPDATE TO authenticated
    USING (auth.uid() = uploader_id AND is_official = false)
    WITH CHECK (auth.uid() = uploader_id AND is_official = false AND visibility = 'private');

CREATE POLICY "documents_delete_own" ON public.pedagogical_documents
    FOR DELETE TO authenticated
    USING (auth.uid() = uploader_id AND is_official = false);

-- 8. STORAGE BUCKET & STORAGE RLS

-- 8.1 Create Private Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pedagogical-documents',
    'pedagogical-documents',
    false,
    20971520, -- 20MB limit
    ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- 8.2 Storage Policies on storage.objects

-- Institutional Documents: Read-only for authenticated users
CREATE POLICY "storage_institutional_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = 'institutional'
    );

-- Private Documents: Owner-only operations
CREATE POLICY "storage_private_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage_private_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage_private_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage_private_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'pedagogical-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

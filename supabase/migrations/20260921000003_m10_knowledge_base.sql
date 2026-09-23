-- M10.2 Database RAG Foundation

-- 1. EXTENSION VECTOR
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TABLE documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    provenance TEXT NOT NULL CHECK (provenance IN ('OFFICIAL', 'STUDENT')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT documents_owner_provenance_check CHECK (
        (provenance = 'OFFICIAL' AND owner_id IS NULL) OR
        (provenance = 'STUDENT' AND owner_id IS NOT NULL)
    )
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLE document_chunks
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    page_number INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES
-- HNSW index for cosine distance on embeddings
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
    ON public.document_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- Classic indexes for efficient joins and filtering
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS documents_subject_id_idx ON public.documents(subject_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_provenance_idx ON public.documents(provenance);
CREATE INDEX IF NOT EXISTS documents_status_idx ON public.documents(status);

-- 5. RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 5.1 RLS documents
-- SELECT
-- OFFICIAL: accessible to authenticated users
CREATE POLICY "documents_official_select" ON public.documents
    FOR SELECT TO authenticated
    USING (provenance = 'OFFICIAL');

-- STUDENT: accessible only to owner
CREATE POLICY "documents_student_select" ON public.documents
    FOR SELECT TO authenticated
    USING (provenance = 'STUDENT' AND owner_id = auth.uid());

-- INSERT
-- Authenticated users can only insert their own STUDENT documents
CREATE POLICY "documents_student_insert" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (provenance = 'STUDENT' AND owner_id = auth.uid());

-- UPDATE
-- Authenticated users can only update their own STUDENT documents
CREATE POLICY "documents_student_update" ON public.documents
    FOR UPDATE TO authenticated
    USING (provenance = 'STUDENT' AND owner_id = auth.uid())
    WITH CHECK (provenance = 'STUDENT' AND owner_id = auth.uid());

-- DELETE
-- Authenticated users can only delete their own STUDENT documents
CREATE POLICY "documents_student_delete" ON public.documents
    FOR DELETE TO authenticated
    USING (provenance = 'STUDENT' AND owner_id = auth.uid());

-- Note: OFFICIAL insert/update/delete will bypass RLS via service_role

-- 5.2 RLS document_chunks
-- Users can access chunks if they can access the parent document
CREATE POLICY "document_chunks_select" ON public.document_chunks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_chunks.document_id
        )
    );

-- Users can insert chunks for their own accessible STUDENT documents
CREATE POLICY "document_chunks_insert" ON public.document_chunks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_chunks.document_id 
            AND d.provenance = 'STUDENT' 
            AND d.owner_id = auth.uid()
        )
    );

-- Users can update chunks for their own accessible STUDENT documents
CREATE POLICY "document_chunks_update" ON public.document_chunks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_chunks.document_id 
            AND d.provenance = 'STUDENT' 
            AND d.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_chunks.document_id 
            AND d.provenance = 'STUDENT' 
            AND d.owner_id = auth.uid()
        )
    );

-- Users can delete chunks for their own accessible STUDENT documents
CREATE POLICY "document_chunks_delete" ON public.document_chunks
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_chunks.document_id 
            AND d.provenance = 'STUDENT' 
            AND d.owner_id = auth.uid()
        )
    );

-- 6. RPC match_document_chunks
CREATE OR REPLACE FUNCTION public.match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_subject_id uuid
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  page_number int,
  provenance text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Safeguards
  IF match_count > 50 THEN
    match_count := 50;
  END IF;

  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.page_number,
    d.provenance,
    dc.metadata
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND d.subject_id = filter_subject_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant EXECUTE to authenticated and service_role (do not grant to anon)
REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector, float, int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, float, int, uuid) TO authenticated, service_role;

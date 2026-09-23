-- Add chunk_index to document_chunks
ALTER TABLE public.document_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER NOT NULL DEFAULT 0;

-- Drop and recreate the RPC to include chunk_index if necessary (not needed in RETURNS TABLE yet unless requested, but let's update it to return chunk_index)
DROP FUNCTION IF EXISTS public.match_document_chunks;

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
  chunk_index int,
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
    dc.chunk_index,
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

REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector, float, int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, float, int, uuid) TO authenticated, service_role;

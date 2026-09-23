-- Fix RAG RPC to strictly isolate STUDENT documents to their owner

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
    AND (d.provenance = 'OFFICIAL' OR (d.provenance = 'STUDENT' AND d.owner_id = auth.uid()))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

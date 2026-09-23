-- M10.6 Storage Unique Path
-- Ensure idempotence by enforcing a unique constraint on storage_path

ALTER TABLE public.documents ADD CONSTRAINT documents_storage_path_key UNIQUE (storage_path);

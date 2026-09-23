-- M10.6 Storage Limit Update
-- Increase the file size limit for pedagogical-documents to 30MB (31457280 bytes)

UPDATE storage.buckets 
SET file_size_limit = 31457280 
WHERE id = 'pedagogical-documents';

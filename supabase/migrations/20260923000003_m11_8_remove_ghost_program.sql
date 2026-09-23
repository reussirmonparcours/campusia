-- M11.8: Remove Ghost Program from Mock Data
BEGIN;

-- Delete the old mock program "Sciences Économiques et de Gestion" 
-- Note: The valid FASEG programs are strictly "Sciences Économiques" and "Gestion".
-- We first remove tracks and semesters to ensure no constraint violations if ON DELETE CASCADE is missing.

DELETE FROM public.tracks 
WHERE program_id IN (
  SELECT id FROM public.programs 
  WHERE name = 'Sciences Économiques et de Gestion'
);

DELETE FROM public.semesters 
WHERE program_id IN (
  SELECT id FROM public.programs 
  WHERE name = 'Sciences Économiques et de Gestion'
);

DELETE FROM public.programs 
WHERE name = 'Sciences Économiques et de Gestion';

COMMIT;

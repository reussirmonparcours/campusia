import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: sems } = await s.from('semesters').select('*');
  const { data: tracks } = await s.from('tracks').select('*');

  // get a subject id
  const { data: subj } = await s.from('subjects').select('id').limit(1).single();
  if (!subj) return;

  for (const sem of sems || []) {
    if (sem.semester_number >= 3) {
      const progTracks = tracks?.filter(t => t.program_id === sem.program_id) || [];
      for (const t of progTracks) {
        await s.from('program_subjects').upsert({
          semester_id: sem.id,
          subject_id: subj.id,
          track_id: t.id
        }, { onConflict: 'semester_id,subject_id,track_id' });
      }
    }
  }
  console.log('Seeded tracks into program_subjects for S3-S6');
}

run();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const {data: progs} = await s.from('programs').select('id,name');
  console.log('Programs:', progs);

  const {data: sems} = await s.from('semesters').select('id,program_id,semester_number').order('semester_number');
  console.log('Semesters:', sems?.length, 'rows');
  for (const sem of sems || []) {
    const prog = progs?.find(p => p.id === sem.program_id);
    console.log(`  ${sem.id} → ${prog?.name || 'UNKNOWN'} S${sem.semester_number}`);
  }

  const {data: tracks} = await s.from('tracks').select('*');
  console.log('Tracks:', tracks?.length, 'rows');
  for (const t of tracks || []) {
    console.log(`  ${t.id} → ${t.name} (${t.code}) program=${t.program_id}`);
  }

  // Check what program_subjects reference for track_id
  const {data: ps} = await s.from('program_subjects').select('id,semester_id,subject_id,track_id');
  console.log('program_subjects:', ps?.length, 'rows');
  const trackIds = new Set(ps?.filter(p => p.track_id).map(p => p.track_id));
  console.log('Distinct track_ids in program_subjects:', [...trackIds]);
}

run();

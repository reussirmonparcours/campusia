import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: programs } = await supabase.from('programs').select('id, name');
  const { data: semesters } = await supabase.from('semesters').select('id, program_id, semester_number');
  const { data: tracks } = await supabase.from('tracks').select('id, name, program_id');
  const { data: programSubjects } = await supabase.from('program_subjects').select('semester_id, track_id');

  const specializedSemesterIds = Array.from(
    new Set(
      programSubjects
        ?.filter((ps) => ps.track_id !== null)
        .map((ps) => ps.semester_id) || []
    )
  );

  console.log("specializedSemesterIds length:", specializedSemesterIds.length);

  for (const progName of ['Gestion', 'Sciences Économiques']) {
    const prog = programs?.find(p => p.name === progName);
    if (!prog) continue;

    for (const semNum of [1, 2, 3, 4, 5, 6]) {
      const sem = semesters?.find(s => s.program_id === prog.id && s.semester_number === semNum);
      if (!sem) continue;

      const isSpecialized = specializedSemesterIds.includes(sem.id);
      
      const programTracks = tracks?.filter(t => t.program_id === prog.id) || [];
      const activeTrackIds = new Set(
        programSubjects
          ?.filter((ps) => ps.semester_id === sem.id && ps.track_id !== null)
          .map((ps) => ps.track_id)
      );

      let availableTracks = programTracks;
      if (activeTrackIds.size > 0) {
        availableTracks = programTracks.filter(t => activeTrackIds.has(t.id));
      } else if (!isSpecialized) {
        availableTracks = []; // Tronc commun visually
      }

      console.log(`\n${progName} S${semNum}:`);
      if (!isSpecialized) {
        console.log(`→ Tronc commun`);
      } else {
        console.log(`→ ${availableTracks.map(t => t.name).join(' / ')}`);
      }
    }
  }
}

run();

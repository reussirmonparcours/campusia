import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // Get the two valid program IDs
  const { data: progs } = await s.from('programs').select('id,name');
  const ecoId = progs?.find(p => p.name === 'Sciences Économiques')?.id;
  const gestId = progs?.find(p => p.name === 'Gestion')?.id;

  if (!ecoId || !gestId) {
    console.error("FAIL: Missing programs");
    return;
  }

  console.log(`Sciences Éco: ${ecoId}`);
  console.log(`Gestion: ${gestId}`);

  // Re-create the 6 tracks with correct program_id
  const tracksToCreate = [
    { program_id: ecoId, name: 'Analyse et Politique Économique', code: 'APE' },
    { program_id: ecoId, name: 'Économie du Développement', code: 'ED' },
    { program_id: ecoId, name: 'Économie Internationale', code: 'EI' },
    { program_id: gestId, name: 'Comptabilité, Contrôle, Audit', code: 'CCA' },
    { program_id: gestId, name: 'Marketing et Stratégie', code: 'M&S' },
    { program_id: gestId, name: 'Organisation et Gestion des Ressources Humaines', code: 'OGRH' },
  ];

  for (const track of tracksToCreate) {
    const { data, error } = await s
      .from('tracks')
      .upsert(track, { onConflict: 'code' })
      .select()
      .single();
    
    if (error) {
      console.error(`Failed to upsert track ${track.code}:`, error.message);
    } else {
      console.log(`✅ Track ${data.code} → ${data.name} (program: ${data.program_id})`);
    }
  }

  // Verify tracks
  const { data: allTracks } = await s.from('tracks').select('id, name, code, program_id');
  console.log(`\nTotal tracks: ${allTracks?.length}`);

  // Now we need to update program_subjects to link tracks
  // Get semesters
  const { data: sems } = await s.from('semesters').select('id, program_id, semester_number');
  
  // Get tracks by program
  const { data: tracks } = await s.from('tracks').select('id, code, program_id');
  
  // For S3-S6 of each program, update program_subjects to add track_id where appropriate
  // The logic: for each program_subject row that belongs to a semester >= S3,
  // we need to create entries per track (if not already existing)
  
  // First let's see what program_subjects look like
  const { data: ps } = await s.from('program_subjects').select('id, semester_id, subject_id, track_id');
  console.log(`\nprogram_subjects: ${ps?.length} rows`);
  
  // Check which semesters are S3+
  const specializedSems = sems?.filter(sem => sem.semester_number >= 3) || [];
  console.log(`Specialized semesters (S3+): ${specializedSems.length}`);
  
  // For each specialized semester's program_subjects with track_id = null,
  // we need to duplicate the row for each track of that program
  const programTracks: Record<string, any[]> = {};
  for (const t of tracks || []) {
    if (!t.program_id) continue;
    if (!programTracks[t.program_id]) programTracks[t.program_id] = [];
    programTracks[t.program_id].push(t);
  }
  
  let updatedCount = 0;
  for (const sem of specializedSems) {
    const semTracks = programTracks[sem.program_id] || [];
    if (semTracks.length === 0) continue;
    
    // Find existing program_subjects for this semester with no track
    const semPs = ps?.filter(p => p.semester_id === sem.id && p.track_id === null) || [];
    
    for (const row of semPs) {
      // For each null-track row, create track-specific rows and delete the null one
      for (const track of semTracks) {
        const { error: insertErr } = await s
          .from('program_subjects')
          .upsert({
            semester_id: row.semester_id,
            subject_id: row.subject_id,
            track_id: track.id,
          }, { onConflict: 'semester_id,subject_id,track_id' });
        
        if (insertErr) {
          console.error(`Failed to insert ps for sem=${sem.semester_number} track=${track.code}:`, insertErr.message);
        }
      }
      
      // Delete the null-track row
      await s.from('program_subjects').delete().eq('id', row.id);
      updatedCount++;
    }
  }

  console.log(`\nUpdated ${updatedCount} program_subjects rows (null-track → per-track)`);

  // Final verification
  const { data: finalPs } = await s.from('program_subjects').select('semester_id, track_id');
  const withTrack = finalPs?.filter(p => p.track_id !== null).length || 0;
  const withoutTrack = finalPs?.filter(p => p.track_id === null).length || 0;
  console.log(`\nFinal program_subjects: ${finalPs?.length} total, ${withTrack} with track, ${withoutTrack} without track (tronc commun)`);
}

run().catch(console.error);

import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  type AcademicContext,
  type AcademicSubjectContext,
  type LearningStatus,
} from "@/types/academic";

/**
 * Retrieves the normalized academic context of a student from Supabase.
 *
 * This function serves as the single source of truth for grounding future AI interactions
 * and generating personalized academic assistance.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Server-only execution.
 * - Enforces database access controls.
 * - Does NOT call any LLM, AI provider, or embedding service in Milestone 02.
 */
export async function getStudentAcademicContext(
  userId: string
): Promise<AcademicContext | null> {
  const supabase = await createClient();

  // 1. Fetch student profile with related academic references
  const { data: profile, error: profileError } = await supabase
    .from("student_profiles")
    .select(`
      user_id,
      first_name,
      last_name,
      display_name,
      registration_year,
      current_track_id,
      current_semester_id,
      program_id,
      custom_institution,
      custom_program,
      custom_level,
      program:programs (
        id,
        name,
        cycle,
        academicUnit:academic_units (
          id,
          name,
          type,
          code,
          institution:institutions (
            id,
            name,
            type,
            code,
            country
          )
        )
      ),
      track:tracks (
        id,
        name,
        code
      ),
      semester:semesters (
        id,
        semester_number,
        total_credits
      )
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  // 2. Fetch student subject progress records with subject details
  const { data: progressRecords, error: progressError } = await supabase
    .from("student_subject_progress")
    .select(`
      id,
      subject_id,
      learning_status,
      is_flagged_difficult,
      subject:subjects (
        id,
        code,
        name,
        credits,
        created_by
      )
    `)
    .eq("user_id", userId);

  if (progressError) {
    return null;
  }

  // Helper type extraction from joined profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProgram = profile.program as any;
  const rawAcademicUnit = rawProgram?.academicUnit;
  const rawInstitution = rawAcademicUnit?.institution;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTrack = profile.track as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSemester = profile.semester as any;

  // 3. Normalize enrolled subjects and categorizations
  const enrolledSubjects: AcademicSubjectContext[] = (progressRecords ?? [])
    .filter((record) => record.subject !== null)
    .map((record) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = record.subject as any;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits ?? null,
        isCustom: s.created_by !== null,
        learningStatus: record.learning_status as LearningStatus,
        isFlaggedDifficult: Boolean(record.is_flagged_difficult),
      };
    });

  const difficultSubjects = enrolledSubjects.filter((s) => s.isFlaggedDifficult);
  const subjectsNeedingReview = enrolledSubjects.filter(
    (s) => s.learningStatus === "a_reviser"
  );
  const masteredSubjects = enrolledSubjects.filter(
    (s) => s.learningStatus === "maitrisee"
  );

  return {
    student: {
      userId: profile.user_id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      displayName: profile.display_name,
      registrationYear: profile.registration_year,
    },
    institution: {
      official: {
        institution: rawInstitution
          ? {
              id: rawInstitution.id,
              name: rawInstitution.name,
              type: rawInstitution.type,
              code: rawInstitution.code,
              country: rawInstitution.country,
            }
          : null,
        academicUnit: rawAcademicUnit
          ? {
              id: rawAcademicUnit.id,
              name: rawAcademicUnit.name,
              type: rawAcademicUnit.type,
              code: rawAcademicUnit.code,
            }
          : null,
        program: rawProgram
          ? {
              id: rawProgram.id,
              name: rawProgram.name,
              cycle: rawProgram.cycle,
            }
          : null,
        track: rawTrack
          ? {
              id: rawTrack.id,
              name: rawTrack.name,
              code: rawTrack.code ?? null,
            }
          : null,
        currentSemester: rawSemester
          ? {
              id: rawSemester.id,
              semesterNumber: rawSemester.semester_number,
              totalCredits: rawSemester.total_credits ?? null,
            }
          : null,
      },
      custom: {
        institutionName: profile.custom_institution ?? null,
        programName: profile.custom_program ?? null,
        levelName: profile.custom_level ?? null,
      },
    },
    progression: {
      enrolledSubjects,
      difficultSubjects,
      subjectsNeedingReview,
      masteredSubjects,
      metrics: {
        totalSubjects: enrolledSubjects.length,
        difficultCount: difficultSubjects.length,
        masteredCount: masteredSubjects.length,
      },
    },
  };
}

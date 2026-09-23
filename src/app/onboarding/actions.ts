"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/types/academic";
import { redirect } from "next/navigation";

export async function completeOnboarding(prevState: unknown, formData: FormData) {
  const rawData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName") || undefined,
    programId: formData.get("programId") || undefined,
    trackId: formData.get("trackId") || undefined,
    semesterId: formData.get("semesterId") || undefined,
    registrationYear: formData.get("registrationYear") || "2024-2025",
    customInstitution: formData.get("customInstitution") || undefined,
    customProgram: formData.get("customProgram") || undefined,
    customLevel: formData.get("customLevel") || undefined,
  };

  const parsed = onboardingSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session expirée ou utilisateur non authentifié. Veuillez vous reconnecter." };
  }

  // 1. Idempotent upsert du profil étudiant
  const { error: profileError } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        display_name:
          parsed.data.displayName || `${parsed.data.firstName} ${parsed.data.lastName}`,
        program_id: parsed.data.programId,
        current_track_id: parsed.data.trackId,
        current_semester_id: parsed.data.semesterId,
        custom_institution: parsed.data.customInstitution,
        custom_program: parsed.data.customProgram,
        custom_level: parsed.data.customLevel,
        registration_year: parsed.data.registrationYear ?? "2024-2025",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (profileError) {
    return { error: `Erreur lors de l'enregistrement du profil: ${profileError.message}` };
  }

  // 2. Récupération des matières associées au semestre sélectionné
  if (parsed.data.semesterId) {
    let query = supabase
      .from("program_subjects")
      .select("subject_id")
      .eq("semester_id", parsed.data.semesterId);
      
    if (parsed.data.trackId) {
      query = query.or(`track_id.is.null,track_id.eq.${parsed.data.trackId}`);
    } else {
      query = query.is("track_id", null);
    }

    const { data: programSubjects, error: subjectsError } = await query;

    if (!subjectsError && programSubjects && programSubjects.length > 0) {
      const progressRecords = programSubjects.map((ss) => ({
        user_id: user.id,
        subject_id: ss.subject_id,
        learning_status: "en_cours" as const,
        is_flagged_difficult: false,
      }));

      // Inscription idempotente (ignoreDuplicates = true pour préserver les progrès existants)
      await supabase.from("student_subject_progress").upsert(progressRecords, {
        onConflict: "user_id,subject_id",
        ignoreDuplicates: true,
      });
    }
  }

  redirect("/dashboard");
}

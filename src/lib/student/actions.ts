"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  createObjectiveSchema, 
  CreateObjectiveInput, 
  updateObjectiveStatusSchema, 
  UpdateObjectiveStatusInput,
  ActivityProvenance,
  StudentObjective
} from "@/types/student";
import { updateSubjectProgressSchema, UpdateSubjectProgressInput } from "@/types/academic";

/**
 * Log a generic activity for the student
 */
export async function logActivity(
  activityType: string,
  description: string,
  provenance: ActivityProvenance = "manual",
  subjectId?: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any> | null = null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("student_activities")
    .insert({
      user_id: user.id,
      subject_id: subjectId ?? null,
      activity_type: activityType,
      description,
      provenance,
      metadata,
      result,
    });

  if (error) {
    console.error("Failed to log activity:", error);
    // Non-blocking for the main action usually, but we can throw if critical
  }
}

/**
 * Create a new objective
 */
export async function createObjective(input: CreateObjectiveInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = createObjectiveSchema.safeParse(input);
  if (!result.success) {
    return { error: "Données invalides", details: result.error.flatten() };
  }

  const { title, objectiveType, subjectId, targetDate } = result.data;

  const { data, error } = await supabase
    .from("student_objectives")
    .insert({
      user_id: user.id,
      title,
      objective_type: objectiveType,
      subject_id: subjectId ?? null,
      target_date: targetDate ?? null,
      status: "in_progress"
    })
    .select()
    .single();

  if (error) {
    console.error("Create objective error:", error);
    return { error: "Impossible de créer l'objectif" };
  }

  // Log activity
  await logActivity(
    "objective_created",
    `Création de l'objectif: ${title}`,
    "manual",
    subjectId,
    { objective_id: data.id }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/objectives");
  return { data: data as StudentObjective };
}

/**
 * Update objective status
 */
export async function updateObjectiveStatus(input: UpdateObjectiveStatusInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = updateObjectiveStatusSchema.safeParse(input);
  if (!result.success) {
    return { error: "Données invalides", details: result.error.flatten() };
  }

  const { id, status } = result.data;

  // We need to fetch the objective first to know its title for the log
  const { data: objective, error: fetchError } = await supabase
    .from("student_objectives")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !objective) {
    return { error: "Objectif introuvable" };
  }

  const { error } = await supabase
    .from("student_objectives")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Update objective status error:", error);
    return { error: "Impossible de mettre à jour l'objectif" };
  }

  await logActivity(
    "objective_status_updated",
    `L'objectif "${objective.title}" est passé au statut ${status}`,
    "manual",
    objective.subject_id,
    { objective_id: id, old_status: objective.status, new_status: status }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/objectives");
  return { success: true };
}

/**
 * Delete an objective
 */
export async function deleteObjective(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: objective, error: fetchError } = await supabase
    .from("student_objectives")
    .select("title, subject_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !objective) {
    return { error: "Objectif introuvable" };
  }

  const { error } = await supabase
    .from("student_objectives")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete objective error:", error);
    return { error: "Impossible de supprimer l'objectif" };
  }

  await logActivity(
    "objective_deleted",
    `Suppression de l'objectif: ${objective.title}`,
    "manual",
    objective.subject_id,
    { objective_id: id }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/objectives");
  return { success: true };
}

/**
 * Update subject progress and log activity
 */
export async function updateSubjectProgress(input: UpdateSubjectProgressInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = updateSubjectProgressSchema.safeParse(input);
  if (!result.success) {
    return { error: "Données invalides", details: result.error.flatten() };
  }

  const { subjectId, learningStatus, isFlaggedDifficult } = result.data;

  // 1. Get current progress to detect what changed
  const { data: currentProgress } = await supabase
    .from("student_subject_progress")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Upsert progress
  const updateData: Record<string, unknown> = {};
  if (learningStatus !== undefined) updateData.learning_status = learningStatus;
  if (isFlaggedDifficult !== undefined) updateData.is_flagged_difficult = isFlaggedDifficult;
  
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("student_subject_progress")
    .upsert({
      user_id: user.id,
      subject_id: subjectId,
      ...(currentProgress ? {} : { learning_status: "en_cours", is_flagged_difficult: false }),
      ...updateData
    }, { onConflict: "user_id, subject_id" });

  if (error) {
    console.error("Update subject progress error:", error);
    return { error: "Impossible de mettre à jour la progression" };
  }

  // 3. Log activities based on what changed
  const changes = [];
  const metadata: Record<string, unknown> = {
    old_status: currentProgress?.learning_status,
    new_status: learningStatus ?? currentProgress?.learning_status,
    old_flag: currentProgress?.is_flagged_difficult,
    new_flag: isFlaggedDifficult ?? currentProgress?.is_flagged_difficult,
  };

  if (learningStatus !== undefined && currentProgress?.learning_status !== learningStatus) {
    changes.push(`Nouveau statut : ${learningStatus}`);
  }
  
  if (isFlaggedDifficult !== undefined && currentProgress?.is_flagged_difficult !== isFlaggedDifficult) {
    changes.push(isFlaggedDifficult ? "Signalé comme difficile" : "Difficulté levée");
  }

  if (changes.length > 0) {
    await logActivity(
      "subject_progress_updated",
      `Mise à jour de la progression : ${changes.join(", ")}`,
      "manual",
      subjectId,
      metadata
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/subjects/${subjectId}`);
  revalidatePath("/dashboard/subjects");
  return { success: true };
}

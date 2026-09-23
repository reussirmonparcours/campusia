import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";

export type FocusType = "objective" | "revision" | "activity" | "none";

export interface FocusDuJour {
  type: FocusType;
  title: string;
  description: string;
  actionLink: string;
  actionText: string;
}

export async function getFocusDuJour(userId: string): Promise<FocusDuJour> {
  const supabase = await createClient();
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  // 1. Priorité 1 : Objectif en cours proche de la date cible (< 3 jours)
  const { data: urgentObjective } = await supabase
    .from("student_objectives")
    .select("id, title, target_date")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .not("target_date", "is", null)
    .lte("target_date", threeDaysFromNow.toISOString())
    .order("target_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (urgentObjective) {
    const isOverdue = new Date(urgentObjective.target_date) < now;
    return {
      type: "objective",
      title: isOverdue ? "Objectif en retard" : "Objectif imminent",
      description: urgentObjective.title,
      actionLink: "/dashboard/objectives",
      actionText: "Voir mes objectifs"
    };
  }

  // 2. Priorité 2 : Matière "a_reviser" (la plus ancienne mise à jour)
  const { data: subjectToRevise } = await supabase
    .from("student_subject_progress")
    .select(`
      subject_id,
      updated_at,
      subject:subjects(name)
    `)
    .eq("user_id", userId)
    .eq("learning_status", "a_reviser")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (subjectToRevise && subjectToRevise.subject) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectName = (subjectToRevise.subject as any).name;
    return {
      type: "revision",
      title: "Matière à réviser",
      description: subjectName,
      actionLink: `/dashboard/subjects/${subjectToRevise.subject_id}`,
      actionText: "Réviser la matière"
    };
  }

  // 3. Priorité 3 : Matière récemment consultée/modifiée dans les activités
  const { data: recentActivity } = await supabase
    .from("student_activities")
    .select(`
      subject_id,
      subject:subjects(name)
    `)
    .eq("user_id", userId)
    .not("subject_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentActivity && recentActivity.subject) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectName = (recentActivity.subject as any).name;
    return {
      type: "activity",
      title: "Dernière activité",
      description: `Reprendre : ${subjectName}`,
      actionLink: `/dashboard/subjects/${recentActivity.subject_id}`,
      actionText: "Continuer l'apprentissage"
    };
  }

  return {
    type: "none",
    title: "Bienvenue !",
    description: "Tout est à jour. Choisissez une matière pour commencer.",
    actionLink: "/dashboard/subjects",
    actionText: "Voir mes matières"
  };
}

export async function getStudentDashboardData(userId: string) {
  const academicContext = await getStudentAcademicContext(userId);
  const focusDuJour = await getFocusDuJour(userId);

  const supabase = await createClient();

  const { data: recentActivities } = await supabase
    .from("student_activities")
    .select(`
      id,
      activity_type,
      description,
      created_at,
      subject_id,
      subject:subjects(name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: activeObjectives } = await supabase
    .from("student_objectives")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("target_date", { ascending: true })
    .limit(3);

  return {
    academicContext,
    focusDuJour,
    recentActivities: recentActivities ?? [],
    activeObjectives: activeObjectives ?? [],
  };
}

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getStudentDashboardData, FocusDuJour } from "@/lib/student/context";
import { getExamAnalytics, getUserExamSessions } from "@/lib/exam/queries";
import { getActiveRevisionSession } from "@/lib/revision/queries";

export type DashboardNextActionType = "exam_active" | "revision_active" | "focus" | "none";

export interface DashboardNextAction {
  type: DashboardNextActionType;
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
  urgency: "critical" | "high" | "normal";
}



export async function getNextBestAction(focusDuJour: FocusDuJour): Promise<DashboardNextAction> {
  const [examSessions, revisionSession] = await Promise.all([
    getUserExamSessions(),
    getActiveRevisionSession(),
  ]);

  // PRIORITÉ 1 : Examen M08 actuellement actif
  const activeExam = examSessions.find((s) => s.status === "active");
  if (activeExam) {
    return {
      type: "exam_active",
      title: "Épreuve en cours",
      description: `Reprendre l'épreuve : ${activeExam.exercise_title}`,
      actionText: "Reprendre l'épreuve",
      actionLink: `/dashboard/exams/${activeExam.id}`,
      urgency: "critical",
    };
  }

  // PRIORITÉ 2 : Session de révision M06 actuellement active
  if (revisionSession) {
    return {
      type: "revision_active",
      title: "Révision en cours",
      description: "Vous avez une session de révision inachevée.",
      actionText: "Continuer la révision",
      actionLink: `/dashboard/revision/session/${revisionSession.id}`,
      urgency: "high",
    };
  }

  // PRIORITÉ 3 : Focus du jour M03
  if (focusDuJour.type !== "none") {
    return {
      type: "focus",
      title: focusDuJour.title,
      description: focusDuJour.description,
      actionText: focusDuJour.actionText,
      actionLink: focusDuJour.actionLink,
      urgency: "normal",
    };
  }

  return {
    type: "none",
    title: focusDuJour.title,
    description: focusDuJour.description,
    actionText: focusDuJour.actionText,
    actionLink: focusDuJour.actionLink,
    urgency: "normal",
  };
}


export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch all existing outputs in parallel
  const [m03Data, examAnalytics] = await Promise.all([
    getStudentDashboardData(user.id),
    getExamAnalytics()
  ]);

  // Orchestrate Next Best Action
  const nextAction = await getNextBestAction(m03Data.focusDuJour);

  return {
    context: m03Data.academicContext,
    nextAction,
    metrics: {
      learning: {
        totalSubjects: m03Data.academicContext?.progression.metrics.totalSubjects ?? 0,
        mastered: m03Data.academicContext?.progression.metrics.masteredCount ?? 0,
        needsReview: (m03Data.academicContext?.progression.metrics.difficultCount ?? 0) + (m03Data.academicContext?.progression.subjectsNeedingReview.length ?? 0),
      },
      exams: {
        totalSimulations: examAnalytics?.global?.totalSimulations ?? 0,
        averageScore: examAnalytics?.global?.averageScorePercentage ?? null,
        averageScorePercentage: examAnalytics?.global?.averageScorePercentage ?? null,
      }
    },
    recentActivities: m03Data.recentActivities,
    activeObjectives: m03Data.activeObjectives,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

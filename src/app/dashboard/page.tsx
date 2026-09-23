import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/queries";
import { redirect } from "next/navigation";
import { DashboardHeader } from "./components/dashboard-header";
import { NextActionHero } from "./components/next-action-hero";
import { MetricsGrid } from "./components/metrics-grid";
import { QuickActions } from "./components/quick-actions";
import { ActiveObjectives } from "./components/active-objectives";
import { RecentActivityList } from "./components/recent-activity-list";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const dashboardData = await getDashboardData();
  const context = dashboardData.context;

  if (!context || (!context.institution.official.currentSemester && !context.institution.custom.levelName)) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header & Contexte académique */}
      <DashboardHeader context={context} />

      {/* 2. Action prioritaire (Next Best Action) */}
      <NextActionHero nextAction={dashboardData.nextAction} />

      {/* 3. Progression & indicateurs d'apprentissage et d'examen */}
      <MetricsGrid metrics={dashboardData.metrics} />

      {/* 4. Accès rapides aux piliers MonParcours */}
      <QuickActions />

      {/* 5. Objectifs actifs et journal d'activité récente */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveObjectives objectives={dashboardData.activeObjectives} />
        <RecentActivityList activities={dashboardData.recentActivities} />
      </div>
    </div>
  );
}

import * as React from "react";
import { ExamHistoryAnalysis } from "@/types/exam";
import { Card, CardContent } from "@/components/ui/card";
import { PerformanceTimeline } from "./performance-timeline";
import { PerformanceBySubject } from "./performance-by-subject";
import { Target, Percent, Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PerformanceOverviewProps {
  analytics: ExamHistoryAnalysis;
}

export function PerformanceOverview({ analytics }: PerformanceOverviewProps) {
  const { global, timeline, bySubject } = analytics;

  const formattedLastDate = global.lastSimulationDate
    ? format(new Date(global.lastSimulationDate), "d MMM yyyy", { locale: fr })
    : "—";

  return (
    <section aria-labelledby="performance-overview-title" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="performance-overview-title" className="text-lg sm:text-xl font-bold text-navy-950">
            Vue d&apos;ensemble de vos performances
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Indicateurs consolidés de vos simulations passées et évolution globale.
          </p>
        </div>
      </div>

      {/* 4 KPI Cards (Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Total simulations */}
        <Card className="border-border-default bg-surface-base shadow-subtle p-5">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total simulations
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-navy-950">
                {global.totalSimulations}
              </div>
              <p className="text-xs text-text-secondary">
                {global.totalSimulations <= 1 ? "Épreuve terminée" : "Épreuves terminées"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 : Moyenne générale */}
        <Card className="border-border-default bg-surface-base shadow-subtle p-5">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Score moyen
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-navy-950">
                {global.averageScorePercentage !== null
                  ? `${global.averageScorePercentage}%`
                  : "—"}
              </div>
              <p className="text-xs text-text-secondary">
                {global.averageScorePercentage !== null
                  ? "Sur les sessions notées"
                  : "Aucune note exploitable"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 : Meilleur score */}
        <Card className="border-border-default bg-surface-base shadow-subtle p-5">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Meilleur score
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-navy-950">
                {global.bestScorePercentage !== null
                  ? `${global.bestScorePercentage}%`
                  : "—"}
              </div>
              <p className="text-xs text-text-secondary">
                {global.bestScorePercentage !== null
                  ? "Record personnel"
                  : "En attente d'épreuve"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 : Dernière simulation */}
        <Card className="border-border-default bg-surface-base shadow-subtle p-5">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Dernière épreuve
              </span>
              <div className="text-lg sm:text-xl font-bold text-navy-950 truncate max-w-[150px]">
                {formattedLastDate}
              </div>
              <p className="text-xs text-text-secondary">
                {global.lastSimulationDate ? "Date de réalisation" : "Aucun historique"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Évolution chronologique des performances (Timeline) */}
      <PerformanceTimeline timeline={timeline} bySubject={bySubject} />

      {/* Répartition descriptive par matière */}
      <PerformanceBySubject bySubject={bySubject} />
    </section>
  );
}

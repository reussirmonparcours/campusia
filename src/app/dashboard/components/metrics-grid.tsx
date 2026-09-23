import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, AlertTriangle, GraduationCap, TrendingUp } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard/queries";

interface MetricsGridProps {
  metrics: DashboardData["metrics"];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const { learning, exams } = metrics;
  const averageScoreFormatted =
    exams.averageScorePercentage !== null
      ? `${exams.averageScorePercentage} %`
      : "—";

  return (
    <section aria-labelledby="metrics-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="metrics-heading" className="text-base font-bold tracking-tight text-navy-950 sm:text-lg">
          Progression académique
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {/* 1. Matières suivies */}
        <Card className="p-4 border-border-default bg-surface-base shadow-subtle hover:shadow-subtle">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Matières
              </span>
              <BookOpen className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-navy-950">
                {learning.totalSubjects}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Inscrites au cursus
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Matières maîtrisées */}
        <Card className="p-4 border-border-default bg-surface-base shadow-subtle hover:shadow-subtle">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Maîtrisées
              </span>
              <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-emerald-700">
                {learning.mastered}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Objectif validé
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. À réviser */}
        <Card className="p-4 border-border-default bg-surface-base shadow-subtle hover:shadow-subtle">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                À réviser
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-amber-600">
                {learning.needsReview}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Rappels nécessaires
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Simulations */}
        <Card className="p-4 border-border-default bg-surface-base shadow-subtle hover:shadow-subtle">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Simulations
              </span>
              <GraduationCap className="h-4 w-4 text-navy-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-navy-900">
                {exams.totalSimulations}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Épreuves passées
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Score moyen */}
        <Card className="col-span-2 p-4 sm:col-span-1 border-border-default bg-surface-base shadow-subtle hover:shadow-subtle">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Score moyen
              </span>
              <TrendingUp className="h-4 w-4 text-gold-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gold-700">
                {averageScoreFormatted}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate" title={exams.averageScorePercentage !== null ? "Moyenne des simulations" : "Pas encore de simulation notée"}>
                {exams.averageScorePercentage !== null
                  ? "Moyenne globale"
                  : "Pas encore notée"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";
import { ExamResultsData } from "@/types/exam";

interface PerformanceSummaryProps {
  results: ExamResultsData;
}

export function PerformanceSummary({ results }: PerformanceSummaryProps) {
  const { summary, session, score } = results;

  const formatElapsed = (seconds: number | null) => {
    if (seconds === null) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">
        Synthèse des métriques
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 : Score M04 */}
        <Card className="bg-surface-base border-border-default shadow-subtle">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span>Score officiel</span>
              <span className="font-bold text-navy-900">{score.percentage ?? 0}%</span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy-950">
              {score.score ?? 0}
              <span className="text-sm sm:text-base font-medium text-text-muted ml-1">
                / {score.maxScore ?? summary.totalQuestions}
              </span>
            </div>
            <span className="text-xs text-text-secondary mt-1">
              Source : M04 Learning Engine
            </span>
          </CardContent>
        </Card>

        {/* Card 2 : Questions Réussies */}
        <Card className="bg-surface-base border-border-default shadow-subtle">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span>Réponses justes</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {summary.correctQuestions}
              <span className="text-sm sm:text-base font-medium text-text-muted ml-1">
                / {summary.totalQuestions}
              </span>
            </div>
            <span className="text-xs text-text-secondary mt-1">
              Questions validées
            </span>
          </CardContent>
        </Card>

        {/* Card 3 : Questions Manquées / Sans Réponse */}
        <Card className="bg-surface-base border-border-default shadow-subtle">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span>À retravailler</span>
              <div className="flex items-center gap-1">
                {summary.incorrectQuestions > 0 && (
                  <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                )}
                {summary.unansweredQuestions > 0 && (
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                )}
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600">
              {summary.incorrectQuestions + summary.unansweredQuestions}
              <span className="text-sm sm:text-base font-medium text-text-muted ml-1">
                questions
              </span>
            </div>
            <span className="text-xs text-text-secondary mt-1">
              {summary.incorrectQuestions} erronée{summary.incorrectQuestions > 1 ? "s" : ""}, {summary.unansweredQuestions} omise{summary.unansweredQuestions > 1 ? "s" : ""}
            </span>
          </CardContent>
        </Card>

        {/* Card 4 : Durée d'examen */}
        <Card className="bg-surface-base border-border-default shadow-subtle">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span>Temps passé</span>
              <Clock className="h-4 w-4 text-navy-500" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy-950">
              {formatElapsed(session.elapsedSeconds)}
            </div>
            <span className="text-xs text-text-secondary mt-1">
              Temps alloué : {session.durationMinutes} min
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

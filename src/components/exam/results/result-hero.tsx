"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Award, ArrowDown, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ExamResultsData } from "@/types/exam";

interface ResultHeroProps {
  results: ExamResultsData;
  onScrollToQuestions?: () => void;
}

export function ResultHero({ results, onScrollToQuestions }: ResultHeroProps) {
  const { session, exercise, score, recommendation } = results;
  const isExpired = session.status === "expired";

  const hasScore = score.score !== null && score.maxScore !== null && score.maxScore > 0;
  const percentage = score.percentage ?? 0;

  // Formatage du temps écoulé
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins} min ${secs} s` : `${mins} min`;
  };

  const formattedElapsed = formatTime(session.elapsedSeconds);

  // Palette sémantique du badge selon la recommandation
  const recBadgeVariant = 
    recommendation.level === "high" ? "success" :
    recommendation.level === "medium" ? "accent" : "warning";

  return (
    <div className="rounded-2xl border border-border-default bg-surface-base shadow-medium overflow-hidden">
      {/* 1. Header Hero avec distinction submitted vs expired */}
      <div
        className={`px-6 py-6 sm:py-8 border-b ${
          isExpired
            ? "bg-amber-500/10 border-amber-200 dark:border-amber-900/40"
            : "bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/40"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-subtle flex-shrink-0 ${
                isExpired ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isExpired ? (
                <Clock className="w-6 h-6 text-amber-600" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden="true" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={isExpired ? "warning" : "success"}>
                  {isExpired ? "Temps écoulé" : "Simulation terminée"}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {exercise.subjectName}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy-950 tracking-tight">
                {exercise.title}
              </h1>
            </div>
          </div>

          {/* Badge de statut rapide */}
          <div className="self-start sm:self-center flex-shrink-0">
            <Link href="/dashboard/exams">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs sm:text-sm font-medium"
                aria-label="Retour à la liste des examens"
              >
                Tous les examens
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Corps du Hero : Score M04, Métriques et Recommandation */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Bloc Score M04 (Authoritative) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-surface-muted border border-border-default text-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              <Award className="h-4 w-4 text-gold-600" />
              Score officiel M04
            </div>

            {hasScore ? (
              <>
                <div className="text-4xl sm:text-5xl font-extrabold text-navy-950 tracking-tight my-1">
                  {score.score}
                  <span className="text-xl sm:text-2xl font-semibold text-text-muted ml-1">
                    / {score.maxScore}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 mt-1">
                  <span
                    className={`text-base font-bold ${
                      percentage >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : percentage >= 50
                        ? "text-gold-600 dark:text-gold-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {percentage}% de réussite
                  </span>
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-navy-950 my-2">
                Évaluation terminée
              </div>
            )}

            {formattedElapsed && (
              <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border-subtle w-full">
                Temps utilisé : <span className="font-medium text-navy-900">{formattedElapsed}</span> / {session.durationMinutes} min
              </div>
            )}
          </div>

          {/* Bloc Recommandation déterministe */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="p-5 rounded-xl border border-border-default bg-surface-base space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Analyse de la simulation
                </span>
                <Badge variant={recBadgeVariant}>
                  {recommendation.badge}
                </Badge>
              </div>

              <p className="text-sm sm:text-base text-navy-900 font-medium leading-relaxed">
                {recommendation.message}
              </p>

              <p className="text-xs text-text-muted pt-1">
                Cette analyse évalue uniquement la performance sur cette simulation d&apos;examen.
              </p>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-3 pt-1">
              {onScrollToQuestions && (
                <Button
                  onClick={onScrollToQuestions}
                  variant="primary"
                  className="w-full sm:w-auto h-11 px-5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Revoir les corrections</span>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}

              <Link href={`/dashboard/exams/new?exerciseId=${exercise.id}`} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 px-4 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Nouvelle simulation</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

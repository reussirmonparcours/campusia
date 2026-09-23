"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowLeft, Award } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExamCompletedProps {
  sessionId?: string;
  status: "submitted" | "expired" | "abandoned";
  exerciseTitle: string;
  subjectName: string;
  totalQuestions: number;
  durationMinutes: number;
  completedAt: string | null;
  score: number | null;
  maxScore: number | null;
}

export function ExamCompleted({
  sessionId,
  status,
  exerciseTitle,
  subjectName,
  totalQuestions,
  durationMinutes,
  completedAt,
  score,
  maxScore,
}: ExamCompletedProps) {
  const isExpired = status === "expired";
  const formattedDate = completedAt
    ? format(new Date(completedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;

  const hasScore = score !== null && maxScore !== null && maxScore > 0;
  const percentage = hasScore ? Math.round((score / maxScore) * 100) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border-default shadow-medium text-center overflow-hidden">
        <div
          className={`py-8 px-6 ${
            isExpired ? "bg-amber-500/10 border-b border-amber-200" : "bg-emerald-500/10 border-b border-emerald-200"
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-subtle bg-surface-base">
            {isExpired ? (
              <Clock className="w-8 h-8 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            )}
          </div>

          <Badge variant={isExpired ? "warning" : "success"} className="mb-2">
            {isExpired ? "Temps imparti écoulé" : "Copie soumise avec succès"}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-bold text-navy-950 mt-1">
            {isExpired ? "Épreuve terminée" : "Félicitations !"}
          </h1>

          <p className="text-sm text-text-secondary mt-1">
            {exerciseTitle} — <span className="font-medium text-navy-900">{subjectName}</span>
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Note / Score si disponible */}
          {hasScore && (
            <div className="p-5 rounded-xl bg-surface-muted border border-border-default flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-text-secondary mb-1">
                <Award className="h-4 w-4 text-gold-600" />
                Score obtenu
              </div>
              <div className="text-4xl font-extrabold text-navy-950">
                {score} <span className="text-xl font-medium text-text-muted">/ {maxScore}</span>
              </div>
              <p className="text-sm font-semibold mt-1 text-navy-700">
                {percentage}% de réussite
              </p>
            </div>
          )}

          {/* Métriques de l'épreuve */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-lg bg-surface-base border border-border-default">
              <span className="text-xs uppercase tracking-wider block font-semibold text-text-muted">
                Questions traitées
              </span>
              <span className="text-base font-bold text-navy-900 mt-0.5 block">
                {totalQuestions} questions
              </span>
            </div>

            <div className="p-4 rounded-lg bg-surface-base border border-border-default">
              <span className="text-xs uppercase tracking-wider block font-semibold text-text-muted">
                Durée allouée
              </span>
              <span className="text-base font-bold text-navy-900 mt-0.5 block">
                {durationMinutes} min
              </span>
            </div>
          </div>

          {formattedDate && (
            <p className="text-xs text-text-muted">
              Clôturé le {formattedDate}
            </p>
          )}

          {/* Navigation de sortie */}
          <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-center gap-3">
            {sessionId && (
              <Link href={`/dashboard/exams/${sessionId}/results`} className="w-full sm:w-auto">
                <Button variant="accent" className="w-full sm:w-auto font-semibold">
                  <Award className="mr-2 h-4 w-4" />
                  Consulter l&apos;analyse détaillée
                </Button>
              </Link>
            )}

            <Link href="/dashboard/exams" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au simulateur
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Cockpit étudiant
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

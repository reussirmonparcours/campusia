"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { findOrCreateRevisionSession } from "@/lib/revision/actions";
import { ExamResultsData } from "@/types/exam";

interface RevisionCTAProps {
  results: ExamResultsData;
}

export function RevisionCTA({ results }: RevisionCTAProps) {
  const { exercise, questionsToReview } = results;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStartRevision = async () => {
    if (!exercise.subjectId) {
      router.push("/dashboard/revision");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      // Intégration native M06 : sélectionne ou crée une session selon la logique de priorité M06 (et le contexte de l'examen si disponible)
      const result = await findOrCreateRevisionSession(exercise.subjectId, {
        attemptId: results.session.attemptId || undefined
      });
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }
      if (result.data?.id) {
        router.push(`/dashboard/revision/session/${result.data.id}`);
      } else {
        router.push("/dashboard/revision");
      }
    } catch {
      setError("Impossible d'initialiser la session de révision.");
      setIsPending(false);
    }
  };

  const hasQuestionsToReview = questionsToReview.length > 0;

  return (
    <div className="rounded-2xl border border-gold-300/60 dark:border-gold-800/40 bg-gradient-to-r from-gold-50/70 to-surface-base dark:from-gold-950/20 dark:to-surface-base p-6 sm:p-7 shadow-subtle">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Moteur de Révision — Module M06</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-navy-950 tracking-tight">
            {hasQuestionsToReview
              ? `${questionsToReview.length} question${questionsToReview.length > 1 ? "s" : ""} à retravailler sur ${exercise.subjectName}`
              : `Parfait ! Continuez à maintenir votre maîtrise sur ${exercise.subjectName}`}
          </h3>

          <p className="text-sm text-text-secondary leading-relaxed">
            {hasQuestionsToReview
              ? "Le moteur de révision M06 adapte votre parcours pour cibler en priorité les notions et questions qui ont posé difficulté."
              : "Vos acquis sont solides sur cet examen blanc. Consolidez votre progression avec de nouveaux exercices ciblés."}
          </p>

          {error && (
            <p className="text-xs text-rose-600 font-medium pt-1" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
          <Button
            onClick={handleStartRevision}
            disabled={isPending}
            variant="accent"
            className="h-11 px-5 font-semibold text-sm shadow-medium flex items-center justify-center gap-2"
            aria-label={`Lancer une session de révision sur ${exercise.subjectName}`}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            <span>{isPending ? "Initialisation..." : "Lancer une session de révision"}</span>
          </Button>

          <Link href="/dashboard/revision" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 px-4 text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>Toutes les révisions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

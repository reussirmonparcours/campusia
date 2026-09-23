"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startExam } from "@/lib/exam/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, ShieldAlert, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ExamInstructionsProps {
  sessionId: string;
  exerciseTitle: string;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: string;
}

export function ExamInstructions({
  sessionId,
  exerciseTitle,
  subjectName,
  durationMinutes,
  totalQuestions,
  difficulty,
}: ExamInstructionsProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const result = await startExam({ sessionId });
      if (result.error) {
        setError(result.error);
        setIsStarting(false);
      } else {
        router.refresh();
      }
    } catch {
      setError("Une erreur inattendue est survenue lors du démarrage.");
      setIsStarting(false);
    }
  };

  const difficultyVariant =
    difficulty === "easy" ? "success" : difficulty === "hard" ? "error" : "warning";
  const difficultyLabel =
    difficulty === "easy" ? "Facile" : difficulty === "hard" ? "Difficile" : "Intermédiaire";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-navy-900 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au simulateur
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="neutral">{subjectName}</Badge>
              <Badge variant={difficultyVariant}>{difficultyLabel}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
              {exerciseTitle}
            </h1>
          </div>
        </div>
      </div>

      <Card className="border-navy-100 shadow-medium">
        <CardHeader className="border-b border-border-subtle bg-navy-50/50">
          <CardTitle className="text-xl text-navy-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold-600" />
            Consignes officielles de l&apos;épreuve
          </CardTitle>
          <CardDescription>
            Veuillez lire attentivement les consignes avant de lancer votre simulation d&apos;examen.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Paramètres de l'examen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-muted border border-border-default">
              <Clock className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Durée de l&apos;épreuve
                </span>
                <span className="text-lg font-bold text-navy-950">
                  {durationMinutes} minutes
                </span>
                <p className="text-xs text-text-muted mt-0.5">
                  Le chronomètre ne peut pas être mis en pause.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-muted border border-border-default">
              <HelpCircle className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Volume de questions
                </span>
                <span className="text-lg font-bold text-navy-950">
                  {totalQuestions} questions
                </span>
                <p className="text-xs text-text-muted mt-0.5">
                  Questions figées aléatoirement pour cette session.
                </p>
              </div>
            </div>
          </div>

          {/* Règles d'examen */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900">
              Règles et déroulement
            </h2>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Environnement autonome :</strong> Aucune aide pédagogique, indice ou correction immédiate n&apos;est accessible durant l&apos;épreuve.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Sauvegarde continue :</strong> Chacune de vos réponses est automatiquement enregistrée sur le serveur dès votre sélection. En cas de rafraîchissement accidentel, vous retrouverez votre session exactement dans l&apos;état quitté.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Gestion du temps :</strong> À la fin des {durationMinutes} minutes, l&apos;épreuve est automatiquement clôturée et aucune modification supplémentaire ne sera acceptée.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Clôture anticipée :</strong> Vous pouvez soumettre votre copie à tout moment lorsque vous avez terminé. Une vérification vous avertira si des questions sont restées sans réponse.
                </span>
              </li>
            </ul>
          </div>

          {error && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-error-bg text-error-text text-sm font-medium border border-error-base/30"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <Link href="/dashboard/exams" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto">
                Annuler
              </Button>
            </Link>

            <Button
              onClick={handleStart}
              disabled={isStarting}
              size="lg"
              className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800 shadow-medium"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Initialisation de l&apos;épreuve...
                </>
              ) : (
                <>
                  Commencer l&apos;examen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuestionWithChoices } from "@/types/learning";
import { submitExamAnswer, finishExam } from "@/lib/exam/actions";
import { ExamTimer } from "./exam-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  HelpCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamSimulatorProps {
  sessionId: string;
  exerciseTitle: string;
  subjectName: string;
  expiresAt: string | null;
  questions: QuestionWithChoices[];
  initialAnswers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }>;
}

export function ExamSimulator({
  sessionId,
  exerciseTitle,
  subjectName,
  expiresAt,
  questions,
  initialAnswers,
}: ExamSimulatorProps) {
  const router = useRouter();

  // État de navigation
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Réponses enregistrées localement (hydratées depuis initialAnswers après refresh)
  const [answers, setAnswers] = useState<
    Record<string, { choiceId: string | null; freeTextAnswer: string | null }>
  >(initialAnswers);

  // Statuts de sauvegarde
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // État de clôture / expiration
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Modales de confirmation
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);

  const [, startTransition] = useTransition();

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  const currentAnswer = answers[currentQuestion?.id] || { choiceId: null, freeTextAnswer: null };

  // Calcul du nombre de questions répondues
  const answeredCount = Object.values(answers).filter(
    (ans) => Boolean(ans.choiceId) || Boolean(ans.freeTextAnswer?.trim())
  ).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Gestion de la sauvegarde d'une réponse
  const persistAnswer = async (choiceId: string | null, freeText: string | null) => {
    if (isExpired || isFinishing) return;

    setSaveStatus("saving");
    setSaveErrorMessage(null);

    try {
      const res = await submitExamAnswer({
        sessionId,
        questionId: currentQuestion.id,
        choiceId,
        freeTextAnswer: freeText,
      });

      if (res.error) {
        if (res.expired) {
          setIsExpired(true);
        }
        setSaveStatus("error");
        setSaveErrorMessage(res.error);
      } else {
        setSaveStatus("saved");
      }
    } catch {
      setSaveStatus("error");
      setSaveErrorMessage("Erreur de connexion lors de la sauvegarde.");
    }
  };

  // Sélection d'un choix
  const handleSelectChoice = async (choiceId: string) => {
    if (isExpired || isFinishing) return;

    // Mise à jour optimiste
    const newAnswer = { choiceId, freeTextAnswer: null };
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newAnswer }));

    await persistAnswer(choiceId, null);
  };

  // Édition d'une réponse libre
  const handleTextChange = (text: string) => {
    if (isExpired || isFinishing) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        choiceId: null,
        freeTextAnswer: text,
      },
    }));
  };

  // Sauvegarde au blur de la zone de texte
  const handleTextBlur = async () => {
    if (isExpired || isFinishing) return;
    const text = currentAnswer.freeTextAnswer || "";
    await persistAnswer(null, text);
  };

  // Callback appelé par le timer à expiration
  const handleTimerExpire = useCallback(() => {
    setIsExpired(true);
  }, []);

  // Soumission finale de l'examen
  const handleFinishExam = async () => {
    setIsFinishing(true);
    setShowSubmitDialog(false);

    try {
      const res = await finishExam({ sessionId });
      if (res.error) {
        setSaveErrorMessage(res.error);
        setIsFinishing(false);
      } else {
        startTransition(() => {
          router.push(`/dashboard/exams/${sessionId}/results`);
        });
      }
    } catch {
      setSaveErrorMessage("Erreur réseau lors de la soumission de la copie.");
      setIsFinishing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] -mt-4 -mb-8">
      {/* 1. Barre d'en-tête spécifique d'examen (épurée, focus & sans distraction) */}
      <header className="sticky top-0 z-30 bg-surface-base border-b border-border-default shadow-subtle px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowExitDialog(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border-default text-text-secondary hover:text-navy-950 hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
              title="Quitter temporairement l'examen"
              aria-label="Quitter l'examen avec confirmation"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted truncate">
                {subjectName}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-navy-950 truncate">
                {exerciseTitle}
              </h1>
            </div>
          </div>

          {/* Timer & Sauvegarde */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Indicateur de sauvegarde */}
            <div className="hidden sm:flex items-center text-xs text-text-muted">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-navy-600 font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sauvegarde...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  Sauvegardé
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Erreur de sauvegarde
                </span>
              )}
            </div>

            {/* Timer React isolé */}
            <ExamTimer expiresAt={expiresAt} onExpire={handleTimerExpire} />
          </div>
        </div>
      </header>

      {/* 2. Bandeau d'alerte expiration si le temps est écoulé */}
      {isExpired && (
        <div
          role="alert"
          className="bg-amber-500/15 border-b border-amber-300 px-4 py-3 text-center sm:px-6"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <span>
                Le temps alloué est écoulé. Les interactions sont désormais verrouillées.
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleFinishExam}
              disabled={isFinishing}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-medium"
            >
              {isFinishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Consulter le récapitulatif"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 3. Contenu principal d'épreuve */}
      <main className="flex-1 max-w-5xl w-full mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Barre de progression & Mini-carte */}
        <div className="bg-surface-base border border-border-default rounded-xl p-4 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-navy-950">
              Question {currentIndex + 1} sur {totalQuestions}
            </span>
            <span className="text-text-secondary">
              {answeredCount} / {totalQuestions} répondue{answeredCount > 1 ? "s" : ""}
            </span>
          </div>

          {/* Mini-carte de progression numérotée (1 2 3 ...) */}
          <nav
            aria-label="Navigation entre les questions"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar"
          >
            {questions.map((q, idx) => {
              const hasAnswer =
                Boolean(answers[q.id]?.choiceId) || Boolean(answers[q.id]?.freeTextAnswer?.trim());
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Aller à la question ${idx + 1}${hasAnswer ? " (répondue)" : ""}`}
                  className={cn(
                    "h-8 w-8 min-w-[2rem] rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
                    isCurrent && "bg-navy-900 text-white shadow-subtle ring-2 ring-navy-900 ring-offset-2",
                    !isCurrent && hasAnswer && "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100",
                    !isCurrent && !hasAnswer && "bg-surface-muted text-text-secondary border border-border-default hover:bg-border-default"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Carte de la question active */}
        <Card className="border-border-default shadow-subtle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <Badge variant="neutral">
              {currentQuestion.question_type === "single_choice"
                ? "Choix unique"
                : currentQuestion.question_type === "multiple_choice"
                ? "Choix multiple"
                : "Réponse libre"}
            </Badge>

            <span className="text-xs text-text-muted">
              ID {currentQuestion.order_index + 1}
            </span>
          </div>

          {/* Énoncé */}
          <div className="prose prose-slate max-w-none">
            <h2 className="text-lg sm:text-xl font-semibold text-navy-950 leading-relaxed">
              {currentQuestion.content}
            </h2>
          </div>

          {/* Zone de choix ou saisie libre */}
          <div className="pt-2">
            {currentQuestion.question_type === "single_choice" ||
            currentQuestion.question_type === "multiple_choice" ? (
              <div
                role="radiogroup"
                aria-label={`Choix pour la question ${currentIndex + 1}`}
                className="grid gap-3"
              >
                {currentQuestion.learning_choices.map((choice) => {
                  const isSelected = currentAnswer.choiceId === choice.id;

                  return (
                    <button
                      key={choice.id}
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isExpired || isFinishing}
                      onClick={() => handleSelectChoice(choice.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
                        isSelected
                          ? "border-navy-900 bg-navy-50/60 shadow-subtle"
                          : "border-border-default hover:border-navy-300 hover:bg-surface-muted/50 bg-surface-base",
                        (isExpired || isFinishing) && "cursor-not-allowed opacity-75"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors",
                          isSelected ? "border-navy-900 bg-navy-900" : "border-text-muted"
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm sm:text-base leading-relaxed",
                          isSelected ? "font-semibold text-navy-950" : "text-text-primary"
                        )}
                      >
                        {choice.content}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor={`free-text-${currentQuestion.id}`}
                  className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Votre réponse argumentée
                </label>
                <textarea
                  id={`free-text-${currentQuestion.id}`}
                  disabled={isExpired || isFinishing}
                  rows={6}
                  placeholder="Rédigez votre réponse ici..."
                  value={currentAnswer.freeTextAnswer || ""}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onBlur={handleTextBlur}
                  className="w-full p-4 rounded-xl border border-border-default bg-surface-base text-text-primary text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-navy-500 resize-y transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Erreur locale de sauvegarde */}
          {saveErrorMessage && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{saveErrorMessage}</span>
            </div>
          )}
        </Card>

        {/* 4. Barre de navigation Précédent / Suivant / Terminer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirst}
            className="min-h-[44px] px-4 sm:px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-3">
            {isLast ? (
              <Button
                variant="primary"
                onClick={() => setShowSubmitDialog(true)}
                disabled={isFinishing}
                className="min-h-[44px] px-6 bg-navy-900 text-white hover:bg-navy-800 font-semibold shadow-medium"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Soumission...
                  </>
                ) : (
                  <>
                    Terminer l&apos;examen
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="min-h-[44px] px-4 sm:px-6 bg-navy-900 text-white hover:bg-navy-800"
              >
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* MODAL 1 : Confirmation de soumission */}
      {showSubmitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs"
        >
          <div className="bg-surface-base rounded-2xl max-w-md w-full p-6 shadow-strong border border-border-default space-y-4 animate-in fade-in zoom-in-95 duration-fast">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-navy-50 text-navy-900">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 id="submit-modal-title" className="text-lg font-bold text-navy-950">
                  Terminer l&apos;examen ?
                </h3>
                <p className="text-xs text-text-secondary">
                  Cette action est définitive et clôturera votre session.
                </p>
              </div>
            </div>

            {/* Avertissement questions non répondues */}
            {unansweredCount > 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Il vous reste {unansweredCount} question{unansweredCount > 1 ? "s" : ""} sans
                    réponse.
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  Les questions non répondues seront comptabilisées comme fausses lors de la correction.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Toutes les questions ont reçu une réponse.</span>
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowSubmitDialog(false)}
                disabled={isFinishing}
              >
                Continuer l&apos;examen
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800"
                onClick={handleFinishExam}
                disabled={isFinishing}
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clôture en cours...
                  </>
                ) : (
                  "Confirmer la soumission"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : Sortie contrôlée avec confirmation */}
      {showExitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs"
        >
          <div className="bg-surface-base rounded-2xl max-w-md w-full p-6 shadow-strong border border-border-default space-y-4 animate-in fade-in zoom-in-95 duration-fast">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-50 text-amber-700">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 id="exit-modal-title" className="text-lg font-bold text-navy-950">
                  Interrompre l&apos;affichage ?
                </h3>
                <p className="text-xs text-text-secondary">
                  Attention : le chronomètre continuera de tourner sur le serveur.
                </p>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              Vos réponses actuelles sont bien enregistrées. Vous pourrez reprendre votre session depuis le menu des examens tant que le temps imparti n&apos;a pas expiré.
            </p>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowExitDialog(false)}
              >
                Rester dans l&apos;examen
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800"
                onClick={() => router.push("/dashboard/exams")}
              >
                Quitter vers le menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MinusCircle, AlertCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { ExamQuestionResult } from "@/types/exam";

interface QuestionCorrectionProps {
  question: ExamQuestionResult;
  questionNumber: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function QuestionCorrection({
  question,
  questionNumber,
  isOpen,
  onToggle,
}: QuestionCorrectionProps) {
  const isFreeText = question.questionType === "free_text";
  const isCorrect = question.status === "correct";
  const isIncorrect = question.status === "incorrect";
  const isUnanswered = question.status === "unanswered";
  const isUnevaluated = question.status === "unevaluated";

  // Difficulté
  const difficultyLabels: Record<string, string> = {
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
  };

  // Statut
  const getStatusBadge = () => {
    if (isCorrect) {
      return (
        <Badge variant="success" className="gap-1 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Validé</span>
        </Badge>
      );
    }
    if (isIncorrect) {
      return (
        <Badge variant="error" className="gap-1 font-semibold">
          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Erroné</span>
        </Badge>
      );
    }
    if (isUnanswered) {
      return (
        <Badge variant="warning" className="gap-1 font-semibold">
          <MinusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Non répondu</span>
        </Badge>
      );
    }
    return (
      <Badge variant="info" className="gap-1 font-semibold">
        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Réponse libre</span>
      </Badge>
    );
  };

  // Explication existante réelle (uniquement si réellement présente en base de données)
  const selectedChoice = question.choices.find(
    (c) => c.id === question.userAnswer?.choiceId
  );
  const correctChoice = question.choices.find((c) => c.isCorrect);

  const hasExplanation = Boolean(
    question.explanation ||
    selectedChoice?.explanation ||
    correctChoice?.explanation
  );

  return (
    <div
      id={`question-${question.id}`}
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isCorrect
          ? "border-border-default bg-surface-base hover:border-emerald-300"
          : isIncorrect
          ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-300"
          : isUnanswered
          ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-300"
          : "border-border-default bg-surface-base"
      }`}
    >
      {/* Barre de résumé d'en-tête (interactive / accordion toggle) */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-xl"
        aria-expanded={isOpen}
        aria-controls={`question-content-${question.id}`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex-shrink-0">
            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />}
            {isIncorrect && <XCircle className="w-5 h-5 text-rose-600" aria-hidden="true" />}
            {isUnanswered && <MinusCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />}
            {isUnevaluated && <AlertCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-navy-950">
                Question {questionNumber}
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-secondary font-medium">
                {difficultyLabels[question.difficulty] || "Moyen"}
              </span>
              {getStatusBadge()}
            </div>

            <p className="text-sm sm:text-base font-semibold text-navy-900 line-clamp-1 sm:line-clamp-2">
              {question.content}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-text-muted">
          <span className="text-xs hidden sm:inline-block font-medium">
            {isOpen ? "Masquer" : "Détails"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Contenu détaillé de la correction (déplié) */}
      {isOpen && (
        <div
          id={`question-content-${question.id}`}
          className="px-4 sm:px-6 pb-6 pt-2 border-t border-border-subtle space-y-5"
        >
          {/* Énoncé complet */}
          <div className="p-4 rounded-lg bg-surface-muted border border-border-default">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted block mb-1">
              Énoncé
            </span>
            <p className="text-base text-navy-950 leading-relaxed whitespace-pre-wrap">
              {question.content}
            </p>
          </div>

          {/* Section Réponses */}
          {isFreeText ? (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted block">
                Votre réponse rédigée
              </span>
              <div className="p-4 rounded-lg bg-surface-base border border-border-default">
                {question.userAnswer?.freeTextAnswer ? (
                  <p className="text-sm text-navy-900 whitespace-pre-wrap">
                    {question.userAnswer.freeTextAnswer}
                  </p>
                ) : (
                  <p className="text-sm italic text-text-muted">
                    Aucune réponse rédigée pour cette question.
                  </p>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Les questions ouvertes ne font pas l&apos;objet d&apos;une correction automatisée de score.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted block">
                Options et correction
              </span>

              <div className="space-y-2">
                {question.choices.map((choice) => {
                  const isSelected = question.userAnswer?.choiceId === choice.id;
                  const isRight = choice.isCorrect;

                  let styleClass = "bg-surface-base border-border-default text-navy-900";
                  let choiceBadge = null;

                  if (isSelected && isRight) {
                    styleClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-medium";
                    choiceBadge = (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="success">Votre choix</Badge>
                        <Badge variant="success">Bonne réponse</Badge>
                      </div>
                    );
                  } else if (isSelected && !isRight) {
                    styleClass = "bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-950 dark:text-rose-200 font-medium";
                    choiceBadge = (
                      <Badge variant="error">Votre choix (Incorrect)</Badge>
                    );
                  } else if (!isSelected && isRight) {
                    styleClass = "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-400/80 text-emerald-900 dark:text-emerald-300 font-medium";
                    choiceBadge = (
                      <Badge variant="success">Bonne réponse</Badge>
                    );
                  }

                  return (
                    <div
                      key={choice.id}
                      className={`p-3.5 sm:p-4 rounded-lg border transition-colors ${styleClass}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="inline-block mt-0.5 flex-shrink-0">
                            {isSelected ? (
                              isRight ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600" />
                              )
                            ) : isRight ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-75" />
                            ) : (
                              <span className="w-4 h-4 block rounded-full border border-border-default" />
                            )}
                          </span>
                          <span className="text-sm leading-relaxed">{choice.content}</span>
                        </div>

                        {choiceBadge && (
                          <div className="flex-shrink-0 self-start sm:self-center ml-6 sm:ml-0">
                            {choiceBadge}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isUnanswered && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span>Vous n&apos;avez pas formulé de réponse pour cette question lors de l&apos;épreuve.</span>
                </div>
              )}
            </div>
          )}

          {/* Section Explication (Affichée STRICTEMENT si réellement présente en base de données) */}
          {hasExplanation && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>Explication pédagogique</span>
              </div>

              {question.explanation && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.explanation}
                </p>
              )}

              {selectedChoice?.explanation && (
                <div className="text-xs pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                  <span className="font-semibold">À propos de votre choix : </span>
                  {selectedChoice.explanation}
                </div>
              )}

              {!isCorrect && correctChoice?.explanation && correctChoice.id !== selectedChoice?.id && (
                <div className="text-xs pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                  <span className="font-semibold">À propos de la bonne réponse : </span>
                  {correctChoice.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

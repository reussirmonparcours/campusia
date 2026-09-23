"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCorrection } from "./question-correction";
import { ExamQuestionResult } from "@/types/exam";
import { CheckCircle2, XCircle, ListFilter, ChevronsUpDown } from "lucide-react";

interface ResultQuestionsListProps {
  questions: ExamQuestionResult[];
}

type FilterType = "all" | "review" | "correct";

export function ResultQuestionsList({ questions }: ResultQuestionsListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  // État des accordéons ouverts (par défaut, ouvrir la première question ou toutes les questions à revoir)
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    questions.forEach((q, idx) => {
      // Ouvre par défaut les questions manquées pour faciliter la revue
      initial[q.id] = q.status === "incorrect" || q.status === "unanswered" || idx === 0;
    });
    return initial;
  });

  // Filtrage des questions
  const filteredQuestions = questions.filter((q) => {
    if (filter === "review") return q.status === "incorrect" || q.status === "unanswered";
    if (filter === "correct") return q.status === "correct";
    return true;
  });

  const correctCount = questions.filter((q) => q.status === "correct").length;
  const reviewCount = questions.filter((q) => q.status === "incorrect" || q.status === "unanswered").length;

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAll = () => {
    const anyOpen = Object.values(openQuestions).some(Boolean);
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = !anyOpen;
    });
    setOpenQuestions(updated);
  };

  const handleJumpToQuestion = (id: string) => {
    // S'assurer que la question est dépliée
    setOpenQuestions((prev) => ({ ...prev, [id]: true }));
    // Défilement doux vers l'élément
    const el = document.getElementById(`question-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div id="corrections-section" className="space-y-6">
      {/* 1. Barre de navigation et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-950">
            Détail des questions et correction
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Analysez vos réponses et découvrez les solutions de l&apos;épreuve.
          </p>
        </div>

        {/* Bouton Tout déplier / replier */}
        <Button
          onClick={handleToggleAll}
          variant="outline"
          size="sm"
          className="h-9 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          <span>{Object.values(openQuestions).some(Boolean) ? "Tout replier" : "Tout déplier"}</span>
        </Button>
      </div>

      {/* 2. Filtres rapides */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === "all"
              ? "bg-navy-900 text-white shadow-subtle"
              : "bg-surface-base border border-border-default text-text-secondary hover:text-navy-900 hover:bg-surface-muted"
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Toutes ({questions.length})</span>
        </button>

        <button
          onClick={() => setFilter("review")}
          className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === "review"
              ? "bg-rose-600 text-white shadow-subtle"
              : "bg-surface-base border border-border-default text-text-secondary hover:text-rose-600 hover:bg-surface-muted"
          }`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          <span>À revoir ({reviewCount})</span>
        </button>

        <button
          onClick={() => setFilter("correct")}
          className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === "correct"
              ? "bg-emerald-600 text-white shadow-subtle"
              : "bg-surface-base border border-border-default text-text-secondary hover:text-emerald-600 hover:bg-surface-muted"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Réussies ({correctCount})</span>
        </button>
      </div>

      {/* 3. Bandeau de saut rapide (pills numérotés tactiles) */}
      <div className="p-3.5 rounded-xl bg-surface-muted border border-border-default space-y-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary block">
          Accès direct aux questions
        </span>

        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const isCorrect = q.status === "correct";
            const isIncorrect = q.status === "incorrect";
            const isUnanswered = q.status === "unanswered";

            let pillStyle = "border-border-default bg-surface-base text-navy-900 hover:border-navy-400";
            if (isCorrect) pillStyle = "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-300";
            else if (isIncorrect) pillStyle = "bg-rose-100 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-300";
            else if (isUnanswered) pillStyle = "bg-amber-100 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300";

            return (
              <button
                key={q.id}
                onClick={() => handleJumpToQuestion(q.id)}
                className={`w-8 h-8 rounded-lg border text-xs font-bold transition-transform active:scale-95 flex items-center justify-center ${pillStyle}`}
                title={`Aller à la question ${idx + 1}`}
                aria-label={`Question ${idx + 1} (${q.status})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Liste des questions */}
      {filteredQuestions.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border-default text-center bg-surface-base space-y-2">
          <p className="text-base font-semibold text-navy-900">
            Aucune question ne correspond à ce filtre.
          </p>
          <Button onClick={() => setFilter("all")} variant="outline" size="sm">
            Afficher toutes les questions
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const originalIndex = questions.findIndex((q) => q.id === question.id);
            return (
              <QuestionCorrection
                key={question.id}
                question={question}
                questionNumber={originalIndex + 1}
                isOpen={Boolean(openQuestions[question.id])}
                onToggle={() => toggleQuestion(question.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

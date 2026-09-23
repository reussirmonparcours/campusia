"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EligibleExercise } from "@/lib/exam/queries";
import { createExam } from "@/lib/exam/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

interface ExamConfigFormProps {
  exercises: EligibleExercise[];
}

export function ExamConfigForm({ exercises }: ExamConfigFormProps) {
  const router = useRouter();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || ""
  );

  const selectedExercise =
    exercises.find((ex) => ex.id === selectedExerciseId) || exercises[0];

  const maxQuestions = selectedExercise?.total_questions || 10;

  // Par défaut, sélectionner le total de questions disponibles (ou max 20)
  const [questionCount, setQuestionCount] = useState<number>(Math.min(maxQuestions, 20));

  // Durée suggérée : environ 2 minutes par question sélectionnée (min 5, max 180)
  const defaultDuration = Math.max(10, Math.min(180, questionCount * 2));
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultDuration);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExerciseChange = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    const newEx = exercises.find((ex) => ex.id === exerciseId);
    if (newEx) {
      const newMax = newEx.total_questions;
      const newCount = Math.min(newMax, 20);
      setQuestionCount(newCount);
      setDurationMinutes(Math.max(10, Math.min(180, newCount * 2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await createExam({
        exerciseId: selectedExercise.id,
        durationMinutes,
        questionCount,
      });

      if (res.error) {
        setError(res.error);
        setIsLoading(false);
      } else if (res.data) {
        router.push(`/dashboard/exams/${res.data.id}`);
      }
    } catch {
      setError("Une erreur inattendue est survenue lors de la création de la session.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border-default shadow-subtle">
        <CardHeader className="border-b border-border-subtle bg-surface-muted/40">
          <CardTitle className="text-lg text-navy-950 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-600" />
            Paramètres de votre session
          </CardTitle>
          <CardDescription>
            Personnalisez le volume de questions et la contrainte de temps pour votre examen blanc.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Sélection de l'exercice */}
          <div className="space-y-2">
            <label
              htmlFor="exercise-select"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
            >
              Matière et Exercice support
            </label>
            <select
              id="exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleExerciseChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-default bg-surface-base text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.subject_name}] {ex.title} ({ex.total_questions} questions)
                </option>
              ))}
            </select>
          </div>

          {selectedExercise && (
            <div className="p-4 rounded-xl bg-navy-50/50 border border-navy-100 flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-navy-950">{selectedExercise.title}</span>
                  <Badge variant="neutral">{selectedExercise.subject_name}</Badge>
                </div>
                {selectedExercise.description && (
                  <p className="text-xs text-text-secondary">{selectedExercise.description}</p>
                )}
                <span className="inline-block mt-2 text-xs font-medium text-navy-800">
                  Total de questions disponibles dans la base : {selectedExercise.total_questions}
                </span>
              </div>
            </div>
          )}

          {/* Nombre de questions sélectionnées */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="question-count"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Nombre de questions sélectionnées
              </label>
              <span className="text-sm font-bold text-navy-950 font-mono">
                {questionCount} question{questionCount > 1 ? "s" : ""}
              </span>
            </div>
            <input
              id="question-count"
              type="range"
              min={1}
              max={maxQuestions}
              value={questionCount}
              onChange={(e) => {
                const count = Number(e.target.value);
                setQuestionCount(count);
                // Mise à jour de la durée suggérée si l'utilisateur n'a pas customisé
                setDurationMinutes(Math.max(5, count * 2));
              }}
              className="w-full accent-navy-900 cursor-pointer h-2 bg-surface-muted rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>1 min</span>
              <span>Maximum : {maxQuestions} questions</span>
            </div>
          </div>

          {/* Durée de l'examen */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="duration-minutes"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Durée allouée (chronomètre strict)
              </label>
              <span className="text-sm font-bold text-navy-950 font-mono">
                {durationMinutes} minute{durationMinutes > 1 ? "s" : ""}
              </span>
            </div>
            <input
              id="duration-minutes"
              type="range"
              min={5}
              max={180}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-navy-900 cursor-pointer h-2 bg-surface-muted rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>5 min (court)</span>
              <span>60 min (standard)</span>
              <span>180 min (3h)</span>
            </div>
          </div>

          {/* Récapitulatif prévisionnel */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-muted border border-border-default">
            <div>
              <span className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
                Temps par question
              </span>
              <span className="text-sm font-bold text-navy-950">
                ~{Math.round((durationMinutes * 60) / questionCount)} sec / question
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
                Tirage
              </span>
              <span className="text-sm font-bold text-navy-950">
                Aléatoire & figé
              </span>
            </div>
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
              <Button type="button" variant="outline" className="w-full sm:w-auto min-h-[44px]">
                Annuler
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isLoading || !selectedExercise}
              className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800 font-semibold shadow-medium min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création de la session...
                </>
              ) : (
                <>
                  Créer et voir les consignes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

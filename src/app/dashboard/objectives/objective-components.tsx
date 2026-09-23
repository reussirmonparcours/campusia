"use client";

import { useState, useTransition } from "react";
import { createObjective, updateObjectiveStatus, deleteObjective } from "@/lib/student/actions";
import { type StudentObjective, OBJECTIVE_TYPES, type ObjectiveType, type ObjectiveStatus } from "@/types/student";
import { type AcademicSubjectContext } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<ObjectiveType, string> = {
  subject: "Matière",
  revision: "Révision",
  progression: "Progression",
  general: "Général",
};

export function ObjectiveForm({ subjects }: { subjects: AcademicSubjectContext[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const objectiveType = formData.get("objectiveType") as ObjectiveType;
    const subjectId = formData.get("subjectId") as string;
    const targetDate = formData.get("targetDate") as string;

    startTransition(async () => {
      const res = await createObjective({
        title,
        objectiveType,
        subjectId: subjectId || null,
        targetDate: targetDate || null,
      });

      if (res.error) {
        setError(res.error);
      } else {
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold">Nouvel Objectif</h2>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Titre de l&apos;objectif</label>
              <input
                id="title"
                name="title"
                required
                placeholder="Ex: Réviser le chapitre 1"
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="objectiveType" className="text-sm font-medium">Type</label>
              <select
                id="objectiveType"
                name="objectiveType"
                required
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              >
                {OBJECTIVE_TYPES.map(type => (
                  <option key={type} value={type}>{typeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="subjectId" className="text-sm font-medium">Matière associée (Optionnel)</label>
              <select
                id="subjectId"
                name="subjectId"
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">-- Aucune matière --</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="targetDate" className="text-sm font-medium">Date cible (Optionnel)</label>
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Création..." : "Créer l'objectif"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ObjectiveList({ objectives, subjects }: { objectives: StudentObjective[], subjects: AcademicSubjectContext[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (id: string, status: ObjectiveStatus) => {
    startTransition(async () => {
      await updateObjectiveStatus({ id, status });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteObjective(id);
    });
  };

  if (objectives.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center bg-transparent shadow-none">
        <p className="text-sm text-slate-500">Aucun objectif pour le moment.</p>
        <p className="text-xs text-slate-400 mt-1">Définissez-en un pour structurer vos révisions !</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {objectives.map(objective => {
        const subject = subjects.find(s => s.id === objective.subjectId);
        
        return (
          <Card key={objective.id} className={objective.status === "achieved" ? "opacity-60" : ""}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {objective.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant="outline">{typeLabels[objective.objectiveType]}</Badge>
                  {subject && <span>Matière: {subject.name}</span>}
                  {objective.targetDate && <span>Cible: {new Date(objective.targetDate).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {objective.status === "in_progress" ? (
                  <>
                    <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleStatusUpdate(objective.id, "achieved")}>
                      Terminer
                    </Button>
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleStatusUpdate(objective.id, "cancelled")}>
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant={objective.status === "achieved" ? "success" : "neutral"}>
                      {objective.status === "achieved" ? "Atteint" : "Annulé"}
                    </Badge>
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleDelete(objective.id)}>
                      Supprimer
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

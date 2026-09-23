"use client";

import * as React from "react";
import Link from "next/link";
import { type AcademicSubjectContext, type LearningStatus } from "@/types/academic";
import { updateSubjectProgress } from "@/lib/student/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SubjectCardProps {
  subject: AcademicSubjectContext;
}

const statusLabels: Record<LearningStatus, { label: string; variant: "default" | "success" | "warning" | "neutral" | "outline" }> = {
  en_cours: { label: "En cours", variant: "default" },
  a_reviser: { label: "À réviser", variant: "warning" },
  comprise: { label: "Comprise", variant: "neutral" },
  maitrisee: { label: "Maîtrisée", variant: "success" },
};

export function SubjectCard({ subject }: SubjectCardProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleStatusChange = (newStatus: LearningStatus) => {
    startTransition(async () => {
      await updateSubjectProgress({ subjectId: subject.id, learningStatus: newStatus });
    });
  };

  const handleToggleDifficulty = () => {
    startTransition(async () => {
      await updateSubjectProgress({ subjectId: subject.id, isFlaggedDifficult: !subject.isFlaggedDifficult });
    });
  };

  const currentStatusInfo = statusLabels[subject.learningStatus] ?? {
    label: subject.learningStatus,
    variant: "neutral",
  };

  return (
    <Card className={`transition-shadow hover:shadow-sm ${subject.isFlaggedDifficult ? "border-amber-400 dark:border-amber-600/60" : ""}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              {subject.code}
            </span>
            {subject.credits && (
              <Badge variant="outline" className="text-[10px]">
                {subject.credits} crédits
              </Badge>
            )}
            {subject.isFlaggedDifficult && (
              <Badge variant="warning" className="text-[10px]">
                Difficulté signalée
              </Badge>
            )}
          </div>
          <CardTitle className="text-base font-semibold leading-snug">
            <Link href={`/dashboard/subjects/${subject.id}`} className="hover:underline">
              {subject.name}
            </Link>
          </CardTitle>
        </div>
        <Badge variant={currentStatusInfo.variant}>
          {currentStatusInfo.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Statut :</span>
            <select
              disabled={isPending}
              value={subject.learningStatus}
              onChange={(e) => handleStatusChange(e.target.value as LearningStatus)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="en_cours">En cours</option>
              <option value="a_reviser">À réviser</option>
              <option value="comprise">Comprise</option>
              <option value="maitrisee">Maîtrisée</option>
            </select>
          </div>

          <Button
            type="button"
            variant={subject.isFlaggedDifficult ? "outline" : "ghost"}
            size="sm"
            disabled={isPending}
            onClick={handleToggleDifficulty}
            className="text-xs"
          >
            {subject.isFlaggedDifficult ? "Retirer le signalement" : "Signaler une difficulté"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

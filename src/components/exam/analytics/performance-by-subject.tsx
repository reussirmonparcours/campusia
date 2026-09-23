import * as React from "react";
import { ExamSubjectPerformance } from "@/types/exam";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface PerformanceBySubjectProps {
  bySubject: Record<string, ExamSubjectPerformance>;
}

export function PerformanceBySubject({ bySubject }: PerformanceBySubjectProps) {
  const subjects = Object.entries(bySubject);

  if (subjects.length === 0) {
    return null;
  }

  return (
    <Card className="border-border-default bg-surface-base shadow-subtle">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-navy-900" />
          <CardTitle>Résultats par matière</CardTitle>
        </div>
        <CardDescription>
          Répartition descriptive de vos simulations et moyennes calculées par discipline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(([id, item]) => (
            <div
              key={id}
              className="p-4 rounded-xl border border-border-default bg-surface-muted/30 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-navy-950 truncate max-w-[180px]">
                    {item.subjectName}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    {item.simulationsCount} simulation{item.simulationsCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Moyenne obtenue</span>
                  <span className="font-bold text-navy-950">{item.averagePercentage}%</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-navy-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, item.averagePercentage))}%` }}
                    role="progressbar"
                    aria-valuenow={item.averagePercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Moyenne en ${item.subjectName}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

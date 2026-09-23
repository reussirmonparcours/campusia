import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DashboardData } from "@/lib/dashboard/queries";

interface ActiveObjectivesProps {
  objectives: DashboardData["activeObjectives"];
}

export function ActiveObjectives({ objectives }: ActiveObjectivesProps) {
  const hasObjectives = objectives && objectives.length > 0;

  return (
    <Card className="border-border-default bg-surface-base shadow-subtle flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-navy-700" aria-hidden="true" />
            <CardTitle className="text-base font-bold tracking-tight text-navy-950">
              Objectifs en cours
            </CardTitle>
          </div>
          <Link
            href="/dashboard/objectives"
            className="inline-flex min-h-[44px] items-center text-xs font-medium text-navy-700 hover:text-navy-900 focus-visible:outline-none focus-visible:underline"
            aria-label="Voir tous les objectifs"
          >
            <span>Gérer</span>
            <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          {!hasObjectives ? (
            <div className="rounded-lg border border-dashed border-border-default p-6 text-center space-y-2">
              <p className="text-sm font-medium text-text-primary">
                Aucun objectif actif
              </p>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                Fixez-vous des buts de révision ou d&apos;examen pour guider votre travail.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/objectives"
                  className="inline-flex min-h-[44px] items-center text-xs font-semibold text-navy-800 hover:underline"
                >
                  Définir un objectif &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle" role="list">
              {objectives.slice(0, 3).map((obj) => {
                const targetDate = obj.target_date ? new Date(obj.target_date) : null;
                const formattedDate = targetDate
                  ? format(targetDate, "d MMM yyyy", { locale: fr })
                  : null;

                return (
                  <li key={obj.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-950 line-clamp-1">
                        {obj.title}
                      </p>
                      <Badge variant="info" className="shrink-0 text-[10px]">
                        En cours
                      </Badge>
                    </div>

                    {formattedDate && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden="true" />
                        <span>Échéance : {formattedDate}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, RotateCcw, GraduationCap, BookOpen, Target, ArrowRight, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { DashboardData } from "@/lib/dashboard/queries";

interface RecentActivityListProps {
  activities: DashboardData["recentActivities"];
}

function getActivityIcon(type: string) {
  const normalized = type?.toLowerCase() || "";
  if (normalized.includes("exam")) {
    return GraduationCap;
  }
  if (normalized.includes("revis")) {
    return RotateCcw;
  }
  if (normalized.includes("exerc") || normalized.includes("quiz")) {
    return BookOpen;
  }
  if (normalized.includes("object")) {
    return Target;
  }
  return Activity;
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const hasActivities = activities && activities.length > 0;
  const items = activities ? activities.slice(0, 3) : [];

  return (
    <Card className="border-border-default bg-surface-base shadow-subtle flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-navy-700" aria-hidden="true" />
            <CardTitle className="text-base font-bold tracking-tight text-navy-950">
              Activité récente
            </CardTitle>
          </div>
          <Link
            href="/dashboard/activity"
            className="inline-flex min-h-[44px] items-center text-xs font-medium text-navy-700 hover:text-navy-900 focus-visible:outline-none focus-visible:underline"
            aria-label="Voir tout l'historique d'activité"
          >
            <span>Historique</span>
            <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          {!hasActivities ? (
            <div className="rounded-lg border border-dashed border-border-default p-6 text-center space-y-2">
              <p className="text-sm font-medium text-text-primary">
                Aucune activité enregistrée
              </p>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                Vos révisions, simulations et exercices terminés apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle" role="list">
              {items.map((activity) => {
                const IconComponent = getActivityIcon(activity.activity_type);
                const relativeTime = formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: fr,
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subjectName = (activity.subject as any)?.name;

                return (
                  <li key={activity.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-navy-700 mt-0.5">
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs sm:text-sm font-medium text-navy-950 line-clamp-2 break-words">
                        {activity.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-secondary">
                        <span className="capitalize">{relativeTime}</span>
                        {subjectName && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="font-medium text-text-primary truncate max-w-[150px]">
                              {subjectName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
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

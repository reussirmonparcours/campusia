import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Target, Sparkles, ArrowRight } from "lucide-react";
import type { DashboardNextAction } from "@/lib/dashboard/queries";

interface NextActionHeroProps {
  nextAction: DashboardNextAction;
}

export function NextActionHero({ nextAction }: NextActionHeroProps) {
  const getActionConfig = () => {
    switch (nextAction.type) {
      case "exam_active":
        return {
          badgeVariant: "error" as const,
          badgeText: "Épreuve active — Priorité absolue",
          icon: AlertCircle,
          iconColor: "text-rose-600",
          cardBorder: "border-rose-300 bg-rose-50/60",
          buttonVariant: "primary" as const,
          buttonClass: "bg-rose-700 hover:bg-rose-800 text-white",
        };
      case "revision_active":
        return {
          badgeVariant: "warning" as const,
          badgeText: "Révision active — Session en attente",
          icon: RotateCcw,
          iconColor: "text-amber-600",
          cardBorder: "border-amber-300 bg-amber-50/60",
          buttonVariant: "primary" as const,
          buttonClass: "bg-navy-900 hover:bg-navy-800 text-white",
        };
      case "focus":
        return {
          badgeVariant: "info" as const,
          badgeText: "Recommandation pédagogique — Focus du jour",
          icon: Target,
          iconColor: "text-blue-600",
          cardBorder: "border-blue-200 bg-blue-50/50",
          buttonVariant: "primary" as const,
          buttonClass: "bg-navy-900 hover:bg-navy-800 text-white",
        };
      case "none":
      default:
        return {
          badgeVariant: "neutral" as const,
          badgeText: "À jour — Aucun retard",
          icon: Sparkles,
          iconColor: "text-gold-600",
          cardBorder: "border-border-default bg-surface-base",
          buttonVariant: "primary" as const,
          buttonClass: "bg-navy-900 hover:bg-navy-800 text-white",
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  return (
    <section aria-labelledby="next-action-heading">
      <Card className={`transition-all ${config.cardBorder} p-5 sm:p-6`}>
        <CardContent className="p-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <IconComponent className={`h-5 w-5 ${config.iconColor} shrink-0`} aria-hidden="true" />
              <span id="next-action-heading" className="sr-only">
                Action prioritaire
              </span>
              <Badge variant={config.badgeVariant}>
                {config.badgeText}
              </Badge>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-navy-950">
                {nextAction.title}
              </h2>
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {nextAction.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 pt-2 sm:pt-0">
            <Link
              href={nextAction.actionLink}
              className="inline-flex w-full sm:w-auto min-h-[44px] items-center"
            >
              <Button
                variant={config.buttonVariant}
                size="md"
                className={`w-full sm:w-auto min-h-[44px] gap-2 font-semibold shadow-sm ${config.buttonClass}`}
              >
                <span>{nextAction.actionText}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Building2, BookOpen, Layers, Award } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard/queries";

interface DashboardHeaderProps {
  context: NonNullable<DashboardData["context"]>;
}

export function DashboardHeader({ context }: DashboardHeaderProps) {
  const { student, institution } = context;
  const isCustom = !institution.official.institution;

  const institutionName = isCustom
    ? institution.custom.institutionName || "Établissement personnalisé"
    : institution.official.institution?.name || "Établissement non renseigné";

  const programName = isCustom
    ? institution.custom.programName || "Programme personnalisé"
    : institution.official.academicUnit?.name || "Composante non renseignée";

  const trackName = isCustom
    ? "Mode Libre"
    : institution.official.track?.name || "Tronc Commun";

  const levelName = isCustom
    ? institution.custom.levelName || "Niveau libre"
    : institution.official.currentSemester
    ? `Semestre ${institution.official.currentSemester.semesterNumber}`
    : "Semestre non renseigné";

  return (
    <header className="space-y-4">
      {/* Salutation et actions principales */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isCustom ? "accent" : "default"}>
              {isCustom ? "Mode Libre" : "Cursus Officiel"}
            </Badge>
            {student.registrationYear && (
              <span className="text-xs text-text-secondary">
                Année {student.registrationYear}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            Bonjour, {student.firstName} 👋
          </h1>
        </div>

        <div className="flex items-center">
          <Link
            href="/onboarding"
            className="inline-flex min-h-[44px] min-w-[44px] items-center"
            aria-label="Modifier le cursus académique"
          >
            <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Modifier cursus
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartouche Académique Synthétique */}
      <Card className="bg-surface-muted/60 p-4 border-border-default shadow-none">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <Building2 className="h-3 w-3 text-text-muted" aria-hidden="true" />
                Établissement
              </span>
              <p className="font-medium text-text-primary line-clamp-1" title={institutionName}>
                {institutionName}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <BookOpen className="h-3 w-3 text-text-muted" aria-hidden="true" />
                Programme
              </span>
              <p className="font-medium text-text-primary line-clamp-1" title={programName}>
                {programName}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <Layers className="h-3 w-3 text-text-muted" aria-hidden="true" />
                Parcours
              </span>
              <p className="font-medium text-text-primary line-clamp-1" title={trackName}>
                {trackName}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <Award className="h-3 w-3 text-text-muted" aria-hidden="true" />
                Niveau
              </span>
              <p className="font-semibold text-navy-900 line-clamp-1" title={levelName}>
                {levelName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </header>
  );
}

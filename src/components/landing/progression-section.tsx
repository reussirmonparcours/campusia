import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  RotateCw, 
  BookOpen, 
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

export function ProgressionSection() {
  const pillars = [
    {
      title: "Matières",
      subtitle: "Savoir ce qui compose votre programme",
      description: "Une vue d'ensemble sur vos cours, unités d'enseignement et chapitres pour ne jamais perdre le cap.",
      icon: BookOpen,
      metric: "5 UEs actives",
    },
    {
      title: "Activités",
      subtitle: "Mesurer ce que vous venez de faire",
      description: "Le récapitulatif chronologique de vos sessions d'étude, chapitres lus et exercices complétés récemment.",
      icon: Clock,
      metric: "12 sessions terminées",
    },
    {
      title: "Révisions",
      subtitle: "Identifier ce qui mérite d'être revu",
      description: "Un diagnostic transparent des notions à consolider pour réviser de façon chirurgicale avant les examens.",
      icon: RotateCw,
      metric: "4 fiches recommandées",
    },
    {
      title: "Progression",
      subtitle: "Savoir exactement où vous en êtes",
      description: "Des indicateurs objectifs de rétention et de maîtrise pour transformer l'effort continu en résultats tangibles.",
      icon: TrendingUp,
      metric: "78% de maîtrise globale",
    },
  ];

  return (
    <section id="progression" className="py-16 md:py-24 bg-surface-muted/40 border-y border-border-default/60">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="neutral" className="text-xs">
            Pilotage des études
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Avancez avec une visibilité totale sur vos révisions.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            MonParcours ne se contente pas de vous fournir des réponses : il vous aide à savoir exactement où vous en êtes, ce que vous avez accompli et ce que vous devez prioriser.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="bg-white border-border-default p-6 flex flex-col justify-between transition-all duration-normal hover:border-navy-300 hover:shadow-medium">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
                    <pillar.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold text-gold-800 bg-gold-50 px-2 py-0.5 rounded">
                    {pillar.metric}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-navy-950">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-medium text-navy-700">
                    {pillar.subtitle}
                  </p>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-navy-900 font-medium">
                <span>Indicateur en temps réel</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-text-muted" />
              </div>
            </Card>
          ))}
        </div>

        {/* Illustrative Synthesis Card */}
        <div className="rounded-2xl border border-border-default bg-white p-6 sm:p-8 shadow-subtle max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy-600">
                Aperçu du tableau de bord étudiant
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-navy-950">
                La méthode de la répétition et de l&apos;ancrage
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed">
                Chaque notion travaillée est classée selon votre niveau de rétention. Plus besoin de vous demander quoi réviser aujourd&apos;hui : MonParcours génère votre liste de travail prioritaire.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto bg-navy-50 rounded-xl p-4 border border-navy-100 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-navy-900">Niveau d&apos;acquisition :</span>
                <span className="font-bold text-navy-950">78%</span>
              </div>
              <div className="h-2 w-48 rounded-full bg-navy-200 overflow-hidden">
                <div className="h-full rounded-full bg-gold-500" style={{ width: "78%" }} />
              </div>
              <span className="text-[10px] text-text-muted">Prochaine validation recommandée : 48h</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, 
  CalendarRange, 
  Target, 
  LineChart 
} from "lucide-react";

export function AudienceSection() {
  const profiles = [
    {
      icon: Compass,
      title: "L'étudiant qui débute son parcours",
      description:
        "Prendre immédiatement de bonnes habitudes de travail universitaire, s'approprier les premières matières fondamentales et éviter le sentiment d'égarement du début d'année.",
      badge: "Entrée à l'université",
    },
    {
      icon: CalendarRange,
      title: "L'étudiant qui veut s'organiser",
      description:
        "En finir avec les nuits blanches de dernière minute. Planifier ses révisions à l'avance et maintenir un rythme régulier semaine après semaine.",
      badge: "Méthode & Régularité",
    },
    {
      icon: Target,
      title: "L'étudiant qui prépare ses examens",
      description:
        "S'entraîner intensivement sur des exercices types, cibler les pièges classiques du programme et vérifier sa maîtrise avant le jour J.",
      badge: "Période de partiels",
    },
    {
      icon: LineChart,
      title: "L'étudiant qui veut suivre ses progrès",
      description:
        "Mesurer l'impact de ses heures de révision, constater concrètement ses acquis et garder un haut niveau de confiance tout au long du semestre.",
      badge: "Suivi continu",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="accent" className="font-semibold text-xs">
            Pour chaque étape des études
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Pensé pour les étudiants.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Quelle que soit votre situation académique, MonParcours s&apos;adapte à vos objectifs pour vous offrir un cadre de travail structurant et motivant.
          </p>
        </div>

        {/* 4 Profiles Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.map((profile) => (
            <Card key={profile.title} className="border-border-default bg-white p-6 flex flex-col justify-between transition-all duration-normal hover:shadow-medium hover:border-navy-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
                    <profile.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge variant="neutral" className="text-[11px]">
                    {profile.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-navy-950">
                  {profile.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {profile.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Catalog Note */}
        <div className="rounded-xl border border-border-default bg-surface-muted/50 p-4 sm:p-5 text-center max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-text-secondary">
            <strong className="text-navy-900 font-semibold">Catalogue académique :</strong> Initialement configuré avec le référentiel de l&apos;Université de Lomé (FASEG), MonParcours est conçu pour s&apos;étendre à l&apos;ensemble des facultés et filières universitaires.
          </p>
        </div>
      </Container>
    </section>
  );
}

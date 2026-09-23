import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, CalendarClock, Compass } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: Layers,
      title: "Cours dispersés",
      description:
        "Polycopiés, diapositives, notes manuscrites et fichiers épars : vous perdez un temps précieux à regrouper vos supports plutôt qu'à vous concentrer sur l'essentiel.",
    },
    {
      icon: CalendarClock,
      title: "Révisions difficiles à organiser",
      description:
        "Sans visibilité claire sur le volume de travail et les priorités de chaque matière, les révisions se concentrent souvent dans l'urgence des derniers jours avant les examens.",
    },
    {
      icon: Compass,
      title: "Difficulté à cibler l'effort",
      description:
        "Il est difficile de savoir avec précision ce qui est réellement acquis et quelles notions méritent d'être retravaillées en priorité pour progresser efficacement.",
    },
  ];

  return (
    <section id="decouvrir" className="py-16 md:py-24 bg-surface-muted/50 border-y border-border-default/60">
      <Container size="lg" className="space-y-12">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-600">
            Le constat étudiant
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Étudier ne devrait pas signifier avancer sans savoir quoi faire.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            La vie universitaire exige beaucoup d&apos;autonomie. Pourtant, l&apos;organisation quotidienne reste souvent le premier frein à la réussite.
          </p>
        </div>

        {/* 3 Problems Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="relative overflow-hidden border-border-default bg-white transition-all duration-normal hover:-translate-y-1 hover:shadow-medium">
              <div className="absolute top-0 left-0 right-0 h-1 bg-navy-200" />
              <CardHeader className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                  <problem.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-lg font-semibold text-navy-950">
                  {problem.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {problem.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

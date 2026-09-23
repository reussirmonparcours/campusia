import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { UserCheck, BookOpenCheck, Award } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: UserCheck,
      title: "Je définis mon parcours",
      description:
        "Sélectionnez votre cursus, votre semestre et vos unités d'enseignement. MonParcours configure immédiatement un espace d'étude adapté à votre programme académique.",
      tag: "Configuration rapide",
    },
    {
      number: "02",
      icon: BookOpenCheck,
      title: "J'apprends et je m'entraîne",
      description:
        "Explorez vos chapitres, révisez vos synthèses de cours et testez immédiatement votre niveau avec des exercices d'entraînement progressifs.",
      tag: "Pratique guidée",
    },
    {
      number: "03",
      icon: Award,
      title: "Je progresse avec l'accompagnement",
      description:
        "Identifiez vos acquis, renforcez vos points fragiles grâce aux recommandations de révision et sollicitez l'IA pour éclaircir vos interrogations spécifiques.",
      tag: "Réussite continue",
    },
  ];

  return (
    <section id="methode" className="py-16 md:py-24 bg-surface-muted/30 border-y border-border-default/60">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-600">
            Méthode d&apos;apprentissage
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Comment fonctionne MonParcours ?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Une démarche progressive et structurée, pensée pour s&apos;intégrer facilement dans votre quotidien universitaire.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid gap-6 md:grid-cols-3 relative">
          {steps.map((step) => (
            <Card key={step.number} className="relative bg-white border-border-default p-6 sm:p-8 flex flex-col justify-between transition-all duration-normal hover:border-navy-300 hover:shadow-medium">
              <div className="space-y-6">
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-extrabold text-navy-200">
                    {step.number}
                  </span>
                  <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-800">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-navy-950">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Step Tag */}
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <span className="text-xs font-medium text-navy-700 bg-navy-50 px-2.5 py-1 rounded-md">
                  {step.tag}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

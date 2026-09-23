import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { UserCheck, ShieldCheck, FileCheck } from "lucide-react";

export function TrustSection() {
  const trustPoints = [
    {
      icon: UserCheck,
      title: "Votre parcours reste personnel",
      description:
        "Vos notes d'étude, vos fiches de travail et votre historique de progression vous appartiennent. Votre espace est strictement privé et dédié à votre réussite personnelle.",
    },
    {
      icon: ShieldCheck,
      title: "Vos données sont protégées",
      description:
        "L'authentification est sécurisée par des sessions chiffrées et une isolation stricte des accès à chaque niveau de l'infrastructure.",
    },
    {
      icon: FileCheck,
      title: "Distinction claire des sources",
      description:
        "MonParcours distingue rigoureusement les référentiels académiques officiels de cours de vos contenus de travail et tentatives d'exercices.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-surface-muted/30 border-y border-border-default/60">
      <Container size="lg" className="space-y-12">
        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-600">
            Éthique &amp; Confidentialité
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Un environnement d&apos;apprentissage sûr et transparent.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Nous plaçons la sérénité et le respect de votre travail au cœur de l&apos;expérience MonParcours.
          </p>
        </div>

        {/* Trust Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {trustPoints.map((point) => (
            <Card key={point.title} className="bg-white border-border-default p-6 space-y-4">
              <div className="h-11 w-11 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
                <point.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-navy-950">
                {point.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {point.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

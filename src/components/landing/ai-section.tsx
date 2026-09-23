import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  RotateCw, 
  Flame, 
  FileQuestion,
  ShieldAlert
} from "lucide-react";

export function AiSection() {
  const interventions = [
    {
      icon: HelpCircle,
      title: "L'explication pédagogique",
      description:
        "Clarifier une notion ou un mécanisme complexe en s'appuyant directement sur le contexte de votre cours, sans digressions génériques.",
    },
    {
      icon: AlertCircle,
      title: "La compréhension d'une erreur",
      description:
        "Analyser une fausse réponse lors d'un exercice pour vous expliquer pourquoi le raisonnement bloque et comment y remédier.",
    },
    {
      icon: RotateCw,
      title: "La révision ciblée",
      description:
        "Sélectionner les concepts à retravailler en priorité selon votre historique d'apprentissage et vos prochaines échéances.",
    },
    {
      icon: Flame,
      title: "Le coaching de travail",
      description:
        "Encourager la régularité, suggérer des sessions adaptées à votre temps disponible et maintenir une méthode rigoureuse.",
    },
    {
      icon: FileQuestion,
      title: "Les exercices d'application",
      description:
        "Générer des questions complémentaires et des mises en situation adaptées au niveau requis par votre formation.",
    },
  ];

  return (
    <section id="ia" className="py-16 md:py-24">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-900">
            <Sparkles className="h-3.5 w-3.5 text-gold-700" />
            <span>Assistance contextualisée</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            L&apos;IA comprend le contexte de votre apprentissage.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            MonParcours ne propose pas un assistant conversationnel isolé. L&apos;intelligence est intégrée à votre parcours : elle connaît vos matières, vos objectifs et vos résultats récents pour intervenir exactement là où vous en avez besoin.
          </p>
        </div>

        {/* 5 Interventions Visual Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interventions.map((item, index) => (
            <Card 
              key={item.title} 
              className={`border-border-default bg-white p-6 transition-all duration-normal hover:shadow-medium hover:border-gold-300 ${
                index === 0 ? "sm:col-span-2 lg:col-span-1 bg-gradient-to-b from-white to-gold-50/20" : ""
              }`}
            >
              <CardHeader className="p-0 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-bold text-navy-950">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Context Banner / Boundary Note Card */}
          <div className="rounded-xl border border-navy-100 bg-navy-900 text-white p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" />
                <span>Rigueur &amp; Clarté</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Un cadre d&apos;aide structuré
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                L&apos;IA est un outil au service de votre réflexion : elle ne se substitue pas à votre travail personnel ni aux enseignements dispensés par vos professeurs.
              </p>
            </div>
            <div className="pt-3 border-t border-navy-800 text-[11px] text-slate-400">
              Référentiel académique officiel • Données étudiantes privées
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

interface PlanFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyEquivalentInYearly?: number;
  yearlySavings?: number;
  features: PlanFeature[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "outline" | "accent";
  isFeatured?: boolean;
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Découverte",
      description: "Pour explorer l'environnement d'apprentissage et s'initier à la méthode.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: "Découvrir MonParcours" },
        { text: "Accès limité aux fonctionnalités principales" },
        { text: "Crédit IA limité" },
        { text: "Import de documents limité" },
      ],
      ctaLabel: "Commencer gratuitement",
      ctaHref: "/auth/register",
      ctaVariant: "outline",
    },
    {
      id: "essential",
      name: "Essentiel",
      description: "La formule idéale pour structurer ses cours et réviser avec régularité.",
      monthlyPrice: 2500,
      yearlyPrice: 25000,
      yearlySavings: 5000,
      features: [
        { text: "Fonctionnalités pédagogiques principales" },
        { text: "Import de documents" },
        { text: "Modules de révision" },
        { text: "Exercices et QCM d'entraînement" },
        { text: "Suivi de progression" },
        { text: "IA avec quota de crédits" },
      ],
      ctaLabel: "Choisir Essentiel",
      ctaHref: "/auth/register?plan=essential",
      ctaVariant: "primary",
    },
    {
      id: "complete",
      name: "Complet",
      badge: "Le plus complet",
      description: "L'accompagnement approfondi pour maximiser ses résultats académiques.",
      monthlyPrice: 3900,
      yearlyPrice: 39000,
      yearlySavings: 7800,
      isFeatured: true,
      features: [
        { text: "Accès complet au périmètre MVP" },
        { text: "Import de documents plus généreux" },
        { text: "Révision avancée" },
        { text: "Exercices et QCM d'entraînement" },
        { text: "Suivi de progression détaillé" },
        { text: "IA avec quota plus généreux" },
        { text: "Fonctionnalités avancées du MVP" },
      ],
      ctaLabel: "Choisir Complet",
      ctaHref: "/auth/register?plan=complete",
      ctaVariant: "accent",
    },
  ];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  return (
    <section id="tarifs" className="py-16 md:py-24 bg-surface-muted/30 border-y border-border-default/60">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="accent" className="font-semibold text-xs">
            Formules &amp; Accès
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Des formules transparentes pour chaque étudiant.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Choisissez la formule adaptée à vos besoins d&apos;apprentissage. L&apos;abonnement annuel vous permet de couvrir l&apos;intégralité de l&apos;année universitaire avec une économie significative.
          </p>

          {/* Billing Switch Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center rounded-xl bg-slate-200/70 p-1.5 border border-border-default">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
                className={cn(
                  "min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
                  billingCycle === "monthly"
                    ? "bg-white text-navy-950 shadow-subtle"
                    : "text-text-secondary hover:text-navy-900"
                )}
              >
                Paiement mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                aria-pressed={billingCycle === "yearly"}
                className={cn(
                  "min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 flex items-center gap-1.5",
                  billingCycle === "yearly"
                    ? "bg-white text-navy-950 shadow-subtle"
                    : "text-text-secondary hover:text-navy-900"
                )}
              >
                <span>Abonnement annuel</span>
                <span className="rounded bg-gold-100 text-gold-900 font-bold px-1.5 py-0.5 text-[10px]">
                  Économique
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {plans.map((plan) => {
            const isYearly = billingCycle === "yearly";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const periodLabel = price === 0 ? "" : isYearly ? "/ an" : "/ mois";

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between p-6 sm:p-8 transition-all duration-normal bg-white",
                  plan.isFeatured
                    ? "border-gold-400 shadow-medium hover:border-gold-500"
                    : "border-border-default hover:border-navy-300 hover:shadow-subtle"
                )}
              >
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-navy-950">
                        {plan.name}
                      </h3>
                      {plan.badge && (
                        <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-gold-900">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="pt-2 pb-4 border-b border-border-subtle">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-3xl sm:text-4xl text-navy-950 tracking-tight">
                        {formatPrice(price)}
                      </span>
                      <span className="text-sm font-semibold text-text-secondary">
                        FCFA {periodLabel}
                      </span>
                    </div>

                    {/* Factual comparison footnote */}
                    {isYearly && plan.yearlySavings && (
                      <p className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-md px-2 py-1">
                        Soit {formatPrice(plan.monthlyPrice * 12)} FCFA en paiement mensuel → économie de {formatPrice(plan.yearlySavings)} FCFA
                      </p>
                    )}
                    {!isYearly && plan.monthlyPrice > 0 && (
                      <p className="mt-2 text-xs text-text-muted">
                        Sans engagement de durée
                      </p>
                    )}
                    {plan.monthlyPrice === 0 && (
                      <p className="mt-2 text-xs text-text-muted">
                        Accès sans carte bancaire
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-900 block">
                      Fonctionnalités incluses :
                    </span>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-text-secondary" aria-label={`Fonctionnalités de l'offre ${plan.name}`}>
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-800 mt-0.5">
                            <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                          </div>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="pt-8 mt-6 border-t border-border-subtle">
                  <Link href={plan.ctaHref} className="block w-full">
                    <Button
                      variant={plan.ctaVariant}
                      size="lg"
                      className="w-full justify-center gap-2 group font-semibold min-h-[44px]"
                    >
                      <span>{plan.ctaLabel}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Reassuring note */}
        <div className="rounded-xl border border-border-default bg-white p-4 sm:p-5 text-center max-w-2xl mx-auto">
          <p className="text-xs text-text-muted leading-relaxed">
            Toutes nos formules sont conçues dans le respect des contraintes budgétaires étudiantes. L&apos;assistance IA fonctionne sur la base de quotas d&apos;utilisation maîtrisés afin de garantir la disponibilité du service.
          </p>
        </div>
      </Container>
    </section>
  );
}

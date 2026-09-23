import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { AiSection } from "@/components/landing/ai-section";
import { ProgressionSection } from "@/components/landing/progression-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { AudienceSection } from "@/components/landing/audience-section";
import { TrustSection } from "@/components/landing/trust-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "MonParcours — Environnement intelligent d'apprentissage universitaire",
  description:
    "MonParcours aide l'étudiant à comprendre ses cours, progresser régulièrement et réussir son parcours universitaire grâce à un accompagnement structuré et contextualisé.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 flex flex-col">
      {/* 1. Hero Section avec aperçu produit */}
      <Hero />

      {/* 2. Section Problème Étudiant */}
      <ProblemSection />

      {/* 3. Section Valeur / Produit (Tout en un endroit) */}
      <FeaturesSection />

      {/* 4. Section Méthode en 3 étapes */}
      <HowItWorksSection />

      {/* 5. Section Accompagnement IA Contextuel */}
      <AiSection />

      {/* 6. Section Logique de Progression */}
      <ProgressionSection />

      {/* 7. Section Tarification */}
      <PricingSection />

      {/* 8. Section Pour qui ? */}
      <AudienceSection />

      {/* 8. Section Confiance, Données & Sécurité */}
      <TrustSection />

      {/* 9. Questions fréquentes */}
      <FaqSection />

      {/* 10. CTA Final */}
      <CtaSection />
    </main>
    <Footer />
  </div>
);
}

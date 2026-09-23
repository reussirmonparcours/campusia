import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "./product-mockup";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      <Container size="xl" className="space-y-12 md:space-y-16 text-center">
        {/* Top Text Block */}
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50/80 px-3.5 py-1 text-xs font-medium text-navy-900 shadow-subtle">
            <span className="flex h-2 w-2 rounded-full bg-gold-500" aria-hidden="true" />
            <span>Votre parcours universitaire, enfin structuré.</span>
          </div>

          {/* Single H1 */}
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]">
            Comprenez vos cours. <br className="hidden sm:inline" />
            <span className="text-navy-800">Progressez avec méthode.</span> <br />
            <span className="text-gold-600">Réussissez votre parcours.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-text-secondary leading-relaxed">
            MonParcours vous accompagne dans vos révisions, vos exercices et votre progression grâce à un environnement d&apos;apprentissage intelligent conçu pour votre parcours universitaire.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto gap-2 group shadow-medium">
                Commencer mon parcours
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="#decouvrir" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Découvrir MonParcours
              </Button>
            </Link>
          </div>

          {/* Subtle Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-navy-600" />
              Espace d&apos;étude personnel et sécurisé
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-gold-600" />
              Accompagnement pédagogique contextualisé
            </span>
          </div>
        </div>

        {/* Illustrative Product Representation */}
        <div className="relative pt-4">
          <ProductMockup />
        </div>
      </Container>
    </section>
  );
}

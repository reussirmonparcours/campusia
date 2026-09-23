import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-navy-950 text-white relative overflow-hidden">
      {/* Background Subtle Highlights */}
      <div 
        className="absolute top-0 right-1/4 -mt-12 h-96 w-96 rounded-full bg-navy-800/40 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-0 left-1/4 -mb-12 h-96 w-96 rounded-full bg-gold-600/10 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <Container size="md" className="relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-navy-700 bg-navy-900/90 px-3.5 py-1 text-xs font-medium text-gold-300">
          <Sparkles className="h-3.5 w-3.5 text-gold-400" />
          <span>Votre rentrée universitaire avec méthode</span>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            Commencez à construire votre parcours.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Rejoignez un espace d&apos;apprentissage pensé pour vos études : structurez vos matières, organisez vos révisions et bénéficiez d&apos;une assistance contextualisée.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/auth/register" className="w-full sm:w-auto">
            <Button size="lg" variant="accent" className="w-full sm:w-auto font-semibold gap-2 shadow-strong group">
              Créer mon compte
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-navy-700 text-white hover:bg-navy-900 hover:text-white">
              Se connecter
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-400 pt-2">
          Accès immédiat • Conçu pour les cursus universitaires
        </p>
      </Container>
    </section>
  );
}

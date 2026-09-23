import * as React from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { BookOpen, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 bg-bg-base">
      <Container size="xl">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Academic Branding (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-6">
              <BrandLogo />
              <div className="space-y-2">
                <Badge variant="accent" className="text-xs font-semibold py-0.5 px-2.5">
                  Plateforme Universitaire Sécurisée
                </Badge>
                <h1 className="text-3xl font-extrabold tracking-tight text-navy-950 leading-tight">
                  Votre parcours académique, structuré et guidé.
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed max-w-md">
                  Rejoignez MonParcours pour accéder à vos unités d&apos;enseignement, réviser avec méthode et bénéficier d&apos;un accompagnement pédagogique intelligent.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-navy-100/70 p-2 text-navy-800 shrink-0">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-navy-950">Matières &amp; Synthèses</h2>
                    <p className="text-xs text-text-secondary">Organisation modulaire conforme au cursus universitaire.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-gold-100 p-2 text-gold-900 shrink-0">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-navy-950">Assistance Contextualisée</h2>
                    <p className="text-xs text-text-secondary">Explications et retours ciblés sur vos erreurs d&apos;exercices.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 shrink-0">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-navy-950">Espace Privé &amp; Protégé</h2>
                    <p className="text-xs text-text-secondary">Vos notes et votre avancement vous appartiennent strictement.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Context Badge */}
            <div className="pt-6 border-t border-border-default flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5 font-medium text-navy-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Université de Lomé • FASEG
              </span>
              <span>Accès Étudiant</span>
            </div>
          </div>

          {/* Right Column: Auth Form Card (Mobile-First) */}
          <div className="w-full lg:col-span-6 flex flex-col items-center">
            {/* Mobile Header Logo */}
            <div className="lg:hidden mb-6 flex flex-col items-center text-center">
              <BrandLogo />
            </div>

            {/* Injected Form Card */}
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

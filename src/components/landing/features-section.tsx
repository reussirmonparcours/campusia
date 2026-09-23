import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookMarked, 
  Lightbulb, 
  CheckSquare, 
  RotateCcw, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="produit" className="py-16 md:py-24">
      <Container size="xl" className="space-y-12 md:space-y-16">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="accent" className="font-semibold text-xs">
            Environnement unifié
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Tout votre parcours d&apos;apprentissage au même endroit.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Plutôt que d&apos;accumuler des outils disparates, MonParcours centralise vos cours, vos entraînements et vos indicateurs de réussite dans une interface cohérente.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 — Hero Feature Card (Spans 2 columns on desktop) */}
          <Card className="lg:col-span-2 border-navy-200 bg-gradient-to-br from-white via-navy-50/20 to-gold-50/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white shadow-subtle">
                <BookMarked className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <Badge variant="neutral" className="text-xs">01 • Socle académique</Badge>
                <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
                  Mes matières : un espace clair et hiérarchisé
                </CardTitle>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Retrouvez l&apos;intégralité de vos unités d&apos;enseignement, de vos semestres et de vos chapitres organisés selon votre cursus universitaire. Chaque cours dispose de ses repères, de ses objectifs d&apos;apprentissage et de ses exercices associés.
                </p>
              </div>
            </div>

            {/* Illustrative mini browser frame */}
            <div className="mt-6 pt-6 border-t border-border-default/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-white p-3 border border-border-default shadow-subtle">
                <span className="text-[11px] font-semibold text-navy-900 block truncate">Microéconomie I</span>
                <span className="text-[10px] text-text-muted">4 chapitres • 18 notions</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border-default shadow-subtle">
                <span className="text-[11px] font-semibold text-navy-900 block truncate">Comptabilité Générale</span>
                <span className="text-[10px] text-text-muted">6 chapitres • 24 notions</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border-default shadow-subtle">
                <span className="text-[11px] font-semibold text-navy-900 block truncate">Mathématiques Appliquées</span>
                <span className="text-[10px] text-text-muted">5 chapitres • 20 notions</span>
              </div>
            </div>
          </Card>

          {/* Feature 2 — Comprendre */}
          <Card className="border-border-default bg-white p-6 sm:p-8 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold-100 text-gold-900">
                <Lightbulb className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <Badge variant="neutral" className="text-xs">02 • Pédagogie</Badge>
                <CardTitle className="text-lg font-bold text-navy-950">
                  Comprendre
                </CardTitle>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Obtenez des explications progressives et adaptées au niveau universitaire. Déconstruisez les théorèmes et concepts complexes étape par étape sans jargon inutile.
              </p>
            </CardHeader>
            <div className="mt-6 pt-4 border-t border-border-subtle text-xs text-navy-800 font-medium flex items-center gap-1.5">
              <span>Clarification conceptuelle pas à pas</span>
            </div>
          </Card>

          {/* Feature 3 — S'entraîner */}
          <Card className="border-border-default bg-white p-6 sm:p-8 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                <CheckSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <Badge variant="neutral" className="text-xs">03 • Entraînement</Badge>
                <CardTitle className="text-lg font-bold text-navy-950">
                  S&apos;entraîner
                </CardTitle>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Testez vos connaissances avec des questions ciblées et des exercices pratiques. Chaque tentative permet de mesurer immédiatement votre degré de compréhension.
              </p>
            </CardHeader>
            <div className="mt-6 pt-4 border-t border-border-subtle text-xs text-navy-800 font-medium flex items-center gap-1.5">
              <span>Auto-évaluation immédiate</span>
            </div>
          </Card>

          {/* Feature 4 — Réviser */}
          <Card className="border-border-default bg-white p-6 sm:p-8 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <Badge variant="neutral" className="text-xs">04 • Rétention</Badge>
                <CardTitle className="text-lg font-bold text-navy-950">
                  Réviser
                </CardTitle>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Identifiez ce qui mérite votre attention. Vos séances de révision sont guidées par vos résultats antérieurs pour consolider les notions fragiles avant les examens.
              </p>
            </CardHeader>
            <div className="mt-6 pt-4 border-t border-border-subtle text-xs text-navy-800 font-medium flex items-center gap-1.5">
              <span>Ciblage intelligent des lacunes</span>
            </div>
          </Card>

          {/* Feature 5 — Suivre sa progression & IA (Wide highlight or complementary) */}
          <Card className="border-gold-300/80 bg-gradient-to-br from-white to-gold-50/30 p-6 sm:p-8 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold-500 text-navy-950 shadow-subtle">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <Badge variant="accent" className="text-xs">05 &amp; 06 • Accompagnement</Badge>
                <CardTitle className="text-lg font-bold text-navy-950">
                  Progression &amp; Accompagnement IA
                </CardTitle>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Visualisez vos progrès au fil des semaines et bénéficiez d&apos;un tuteur intelligent disponible pour clarifier vos doutes en tenant compte de votre parcours d&apos;apprentissage.
              </p>
            </CardHeader>
            <div className="mt-6 pt-4 border-t border-gold-200 text-xs font-semibold text-navy-950 flex items-center justify-between">
              <span>Mesure factuelle &amp; aide active</span>
              <ArrowRight className="h-4 w-4 text-gold-700" />
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

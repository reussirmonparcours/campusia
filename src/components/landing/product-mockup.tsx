import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  BarChart3, 
  Layers,
  GraduationCap
} from "lucide-react";

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-border-default bg-surface-base shadow-strong overflow-hidden text-left">
      {/* Top Application Window Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-default bg-surface-muted/70 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-3 w-3 rounded-full bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-300" />
          </div>
          <span className="ml-3 text-xs font-medium text-text-secondary hidden sm:inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-navy-600" />
            Licence 1 • Économie &amp; Gestion • Semestre 1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" className="text-[11px] font-semibold py-0.5 px-2">
            Aperçu de l&apos;interface
          </Badge>
          <span className="text-[11px] text-text-muted font-mono hidden md:inline">v1.0</span>
        </div>
      </div>

      {/* Main Workspace Preview Grid */}
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:gap-8 bg-gradient-to-b from-white to-slate-50/50">
        {/* Left Column: Learning Track & Priority Focus (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Focus Card */}
          <div className="rounded-xl border border-border-default bg-white p-4 sm:p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-navy-50 p-1.5 text-navy-800">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-950">Focus du jour</h4>
                  <p className="text-xs text-text-secondary">2 modules prioritaires à consolider</p>
                </div>
              </div>
              <Badge variant="default" className="text-[11px]">2 / 3 complétés</Badge>
            </div>

            {/* Task Item 1 */}
            <div className="group rounded-lg border border-border-subtle bg-slate-50/80 p-3.5 transition-colors hover:border-navy-200 hover:bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-900">Microéconomie I</span>
                    <span className="text-[10px] text-text-muted">• Chapitre 2</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Équilibre du consommateur et taux marginal de substitution
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-gold-700 bg-gold-50 px-2 py-0.5 rounded">
                  75% acquis
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-navy-700 transition-all" style={{ width: "75%" }} />
                </div>
                <span className="text-[11px] font-medium text-navy-800 shrink-0 flex items-center gap-1">
                  Reprendre <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Task Item 2 */}
            <div className="group rounded-lg border border-border-subtle bg-slate-50/80 p-3.5 transition-colors hover:border-navy-200 hover:bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-900">Comptabilité Générale</span>
                    <span className="text-[10px] text-text-muted">• Exercice 4</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Passation des écritures d&apos;inventaire et bilan de clôture
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  45% acquis
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: "45%" }} />
                </div>
                <span className="text-[11px] font-medium text-navy-800 shrink-0 flex items-center gap-1">
                  S&apos;entraîner <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border-subtle bg-white p-3 text-center">
              <span className="text-xs text-text-secondary block">Matières actives</span>
              <span className="text-base sm:text-lg font-bold text-navy-950">5 UEs</span>
            </div>
            <div className="rounded-lg border border-border-subtle bg-white p-3 text-center">
              <span className="text-xs text-text-secondary block">Questions réussies</span>
              <span className="text-base sm:text-lg font-bold text-navy-950">84%</span>
            </div>
            <div className="rounded-lg border border-border-subtle bg-white p-3 text-center">
              <span className="text-xs text-text-secondary block">Prochaine révision</span>
              <span className="text-base sm:text-lg font-bold text-gold-700">Demain</span>
            </div>
          </div>
        </div>

        {/* Right Column: Contextual Learning Assistant (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-border-default bg-white p-4 sm:p-5 shadow-subtle space-y-4">
          <div>
            {/* Assistant Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-gold-100 p-1.5 text-gold-800">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-950">Accompagnement IA</h4>
                  <p className="text-[11px] text-text-secondary">Ancré dans votre programme</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Contextualisé
              </span>
            </div>

            {/* Chat Exchange */}
            <div className="mt-4 space-y-3">
              {/* Student Query */}
              <div className="rounded-lg bg-navy-50/70 p-3 border border-navy-100/60">
                <p className="text-[11px] font-semibold text-navy-900 mb-1">Votre question</p>
                <p className="text-xs text-navy-950 leading-relaxed">
                  &ldquo;Quelle est la différence fondamentale entre bien normal et bien inférieur ?&rdquo;
                </p>
              </div>

              {/* AI Pedagogical Answer */}
              <div className="rounded-lg bg-slate-50 p-3 border border-border-subtle space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gold-800">
                  <BookOpen className="h-3 w-3" />
                  <span>Explication Microéconomie I</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  L&apos;élasticité-revenu détermine la nature du bien : lorsque le revenu de l&apos;étudiant augmente, la demande d&apos;un <strong className="text-navy-950 font-medium">bien normal</strong> s&apos;accroît (E<sub>R</sub> &gt; 0), alors que celle d&apos;un <strong className="text-navy-950 font-medium">bien inférieur</strong> diminue (E<sub>R</sub> &lt; 0), car il est substitué par un bien de meilleure qualité.
                </p>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Source : Syllabus officiel FASEG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Historique synchronisé
            </span>
            <span className="font-medium text-navy-900 flex items-center gap-1 hover:text-gold-700 transition-colors cursor-default">
              <BarChart3 className="h-3.5 w-3.5" />
              Fiche de synthèse liée
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

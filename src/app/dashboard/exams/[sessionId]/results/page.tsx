import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getExamResults } from "@/lib/exam/queries";
import { ResultHero } from "@/components/exam/results/result-hero";
import { PerformanceSummary } from "@/components/exam/results/performance-summary";
import { RevisionCTA } from "@/components/exam/results/revision-cta";
import { ResultQuestionsList } from "@/components/exam/results/result-questions-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";

interface ExamResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ExamResultsPage({ params }: ExamResultsPageProps) {
  const { sessionId } = await params;

  // 1. Vérifier l'authentification
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/dashboard/exams/${sessionId}/results`);
  }

  // 2. Récupérer les résultats via la query sécurisée M08.4
  const resultResponse = await getExamResults(sessionId);

  // 3. Gestion des états de refus ou de session active
  if (!resultResponse.success) {
    // Si la session est toujours active ou planifiée, rediriger vers le simulateur actif
    if (resultResponse.code === "SESSION_ACTIVE") {
      redirect(`/dashboard/exams/${sessionId}`);
    }

    // Affichage des états d'erreur sécurisés sans stack trace
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-border-default bg-surface-base p-8 text-center shadow-medium space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold text-navy-950">
            {resultResponse.code === "NOT_FOUND"
              ? "Examen introuvable"
              : resultResponse.code === "UNAUTHORIZED"
              ? "Accès refusé"
              : "Résultats non disponibles"}
          </h1>

          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            {resultResponse.error}
          </p>

          <div className="pt-4">
            <Link href="/dashboard/exams">
              <Button variant="primary" className="h-10 px-5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au simulateur
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const results = resultResponse.data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Fil d'Ariane / Navigation supérieure */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-navy-900 transition-colors">
          Tableau de bord
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/exams" className="hover:text-navy-900 transition-colors">
          Simulateur d&apos;examen
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-navy-900 truncate max-w-[200px] sm:max-w-none">
          Résultats : {results.exercise.title}
        </span>
      </nav>

      {/* 1. ResultHero */}
      <ResultHero results={results} />

      {/* 2. PerformanceSummary */}
      <PerformanceSummary results={results} />

      {/* 3. RevisionCTA (intégration native M06) */}
      <RevisionCTA results={results} />

      {/* 4. ResultQuestionsList & QuestionCorrection */}
      <ResultQuestionsList questions={results.questions} />

      {/* 5. Navigation de bas de page */}
      <div className="pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/dashboard/exams" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto h-11">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux examens blancs
          </Button>
        </Link>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto h-11">
            Retour au cockpit étudiant
          </Button>
        </Link>
      </div>
    </div>
  );
}

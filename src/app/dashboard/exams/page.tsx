import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserExamSessions, getEligibleExercises, getExamAnalytics } from "@/lib/exam/queries";
import { PerformanceOverview } from "@/components/exam/analytics/performance-overview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/exams");
  }

  const [sessions, eligibleExercises, analytics] = await Promise.all([
    getUserExamSessions(),
    getEligibleExercises(),
    getExamAnalytics(),
  ]);

  const activeSessions = sessions.filter((s) => s.status === "active" || s.status === "planned");
  const pastSessions = sessions.filter((s) => s.status === "submitted" || s.status === "expired");

  const hasEligibleContent = eligibleExercises.length > 0;

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Module M08</Badge>
            <span className="text-xs text-text-secondary">Simulateur d&apos;évaluations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
            Examens blancs
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Entraînez-vous dans les conditions réelles d&apos;un partiel universitaire : temps limité, questions figées et notation standardisée.
          </p>
        </div>

        {hasEligibleContent && (
          <Link href="/dashboard/exams/new" className="shrink-0">
            <Button className="bg-navy-900 text-white hover:bg-navy-800 font-semibold shadow-subtle min-h-[44px]">
              <PlusCircle className="mr-2 h-4 w-4" />
              Simuler un examen
            </Button>
          </Link>
        )}
      </div>

      {/* Sessions en cours / actives nécessitant reprise */}
      {activeSessions.length > 0 && (
        <section aria-labelledby="active-sessions-title" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 id="active-sessions-title" className="text-lg font-bold text-navy-950">
              Sessions en cours
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {activeSessions.map((session) => {
              const isPlanned = session.status === "planned";

              return (
                <Card
                  key={session.id}
                  className="border-amber-200 bg-amber-50/40 hover:border-amber-300 shadow-subtle transition-all"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="neutral">{session.subject_name}</Badge>
                        <Badge variant={isPlanned ? "info" : "warning"}>
                          {isPlanned ? "À démarrer" : "Épreuve en cours"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-navy-950 text-base">
                        {session.exercise_title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {session.duration_minutes} min
                        </span>
                        <span>{session.total_questions} questions</span>
                      </div>
                    </div>

                    <Link href={`/dashboard/exams/${session.id}`} className="block w-full">
                      <Button
                        size="sm"
                        className="w-full bg-navy-900 text-white hover:bg-navy-800 font-medium min-h-[44px]"
                      >
                        {isPlanned ? "Voir les consignes" : "Reprendre l'épreuve"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* État vide si aucun contenu pédagogique n'est disponible */}
      {!hasEligibleContent && (
        <Card className="border-dashed p-10 text-center bg-surface-muted/30 shadow-none">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy-50 text-navy-700 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">Aucun examen blanc disponible</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mt-1 mb-6">
            Aucun exercice comportant des questions d&apos;évaluation n&apos;est actuellement configuré dans vos matières.
          </p>
          <Link href="/dashboard/subjects">
            <Button variant="outline">
              Explorer les matières
            </Button>
          </Link>
        </Card>
      )}

      {/* Si du contenu est disponible, carte de configuration rapide */}
      {hasEligibleContent && activeSessions.length === 0 && (
        <Card className="border-border-default bg-surface-base shadow-subtle p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-700">
                <Sparkles className="h-4 w-4" />
                Prêt pour l&apos;entraînement
              </div>
              <h2 className="text-xl font-bold text-navy-950">
                Lancez une simulation d&apos;examen blanc
              </h2>
              <p className="text-sm text-text-secondary max-w-xl">
                Choisissez une matière et un exercice pour composer un examen blanc sur-mesure avec durée et questions adaptées.
              </p>
            </div>
            <Link href="/dashboard/exams/new" className="shrink-0 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800 shadow-medium min-h-[44px]">
                Configurer un examen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Section M08.4.3 : Vue d'ensemble des performances analytiques */}
      {pastSessions.length > 0 && (
        <PerformanceOverview analytics={analytics} />
      )}

      {/* Historique des sessions passées */}
      {pastSessions.length > 0 && (
        <section aria-labelledby="past-sessions-title" className="space-y-4">
          <h2 id="past-sessions-title" className="text-lg font-bold text-navy-950">
            Historique de vos examens
          </h2>

          <div className="space-y-3">
            {pastSessions.map((session) => {
              const isSubmitted = session.status === "submitted";
              const dateStr = session.completed_at || session.created_at;
              const formattedDate = dateStr
                ? format(new Date(dateStr), "d MMMM yyyy", { locale: fr })
                : "Date inconnue";

              return (
                <Card
                  key={session.id}
                  className="hover:border-navy-200 transition-colors shadow-subtle"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{session.subject_name}</Badge>
                        <Badge variant={isSubmitted ? "success" : "warning"}>
                          {isSubmitted ? "Soumis" : "Temps écoulé"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-navy-950 text-base">
                        {session.exercise_title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span>{session.total_questions} questions</span>
                        <span>•</span>
                        <span>{session.duration_minutes} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border-subtle">
                      {session.score !== null && session.max_score !== null && (
                        <div className="text-right">
                          <span className="text-xs uppercase tracking-wider block font-semibold text-text-muted">
                            Note finale
                          </span>
                          <span className="text-lg font-bold text-navy-950">
                            {session.score} / {session.max_score}
                          </span>
                        </div>
                      )}

                      <Link href={`/dashboard/exams/${session.id}/results`}>
                        <Button variant="outline" size="sm" className="min-h-[44px]">
                          Voir les résultats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

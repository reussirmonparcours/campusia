import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, AlertCircleIcon, BookOpenIcon, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StartRevisionAttemptButton, CloseSessionButton } from "./start-attempt-button";
import { getPriorityExercisesForSubjectLogic } from "@/lib/revision/priority";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function RevisionSessionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { sessionId } = resolvedParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch session details
  const { data: session, error: sessionError } = await supabase
    .from("revision_sessions")
    .select(`
      id, status, created_at,
      subjects ( id, name ),
      learning_exercises ( id, title, description, difficulty, exercise_type )
    `)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    redirect("/dashboard/revision");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exercise = session.learning_exercises as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subject = session.subjects as any;

  // Fetch revision attempts for this session to see if there are any completed M04 attempts
  const { data: revisionAttempts } = await supabase
    .from("revision_attempts")
    .select(`
      id,
      learning_attempts ( id, score, max_score, status, completed_at )
    `)
    .eq("revision_session_id", sessionId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedAttempts = revisionAttempts?.map(ra => ra.learning_attempts as unknown as any).filter(la => la && la.status === 'completed') || [];
  const hasCompletedAttempt = completedAttempts.length > 0;

  // Let's recalculate the reasons to display them. This is purely informational UI.
  // In a real prod environment we might store reasons in revision_sessions, but for M06 MVP 
  // we just re-run the priority engine for this subject to find the reasons for this exercise.
  const priorityExercises = await getPriorityExercisesForSubjectLogic(supabase, user, subject.id);
  const exercisePriority = priorityExercises.find(pe => pe.exerciseId === exercise.id);
  const reasons = exercisePriority?.reasons || [];
  const isNeverReviewed = reasons.some(r => r.type === 'never_reviewed');

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <Link 
          href="/dashboard/revision" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Retour aux matières
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Session de Révision
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm sm:text-base">
              <BookOpenIcon className="h-4 w-4" /> 
              {subject.name}
            </p>
          </div>
          
          <div className="shrink-0">
            {session.status === 'completed' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Session Terminée
              </span>
            ) : session.status === 'abandoned' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                <RotateCcw className="w-4 h-4 mr-2" /> Session Abandonnée
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-medium">
                <AlertCircleIcon className="w-4 h-4 mr-2" /> Session Active
              </span>
            )}
          </div>
        </div>
      </div>

      {session.status === 'active' && (
        <Card className={`border-l-4 ${isNeverReviewed ? 'border-l-blue-500' : 'border-l-amber-500'} bg-card shadow-sm`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {isNeverReviewed ? "Nouvelle notion à découvrir" : "Analyse des performances"}
            </CardTitle>
            <CardDescription>
              Voici pourquoi cet exercice a été ciblé pour votre révision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reasons.length > 0 ? (
              <ul className="space-y-2">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {reason.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Priorité standard.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold">{exercise.title}</h2>
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
              exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {exercise.difficulty === 'easy' ? 'Facile' : exercise.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm sm:text-base">
            {exercise.description || "Aucune description fournie pour cet exercice."}
          </p>
          
          <div className="bg-muted/30 rounded-md p-4 mb-6">
            <p className="text-sm text-muted-foreground capitalize">Type : {exercise.exercise_type}</p>
          </div>

          {session.status === 'active' ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 border-t pt-6 mt-6">
              <StartRevisionAttemptButton sessionId={sessionId} exerciseId={exercise.id} />
              
              {hasCompletedAttempt && (
                <div className="w-full sm:w-auto sm:ml-auto">
                  <CloseSessionButton sessionId={sessionId} />
                </div>
              )}
            </div>
          ) : (
            <div className="border-t pt-6 mt-6">
              <Link
                href="/dashboard/revision"
                className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                Nouvelle session de révision
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {completedAttempts.length > 0 && (
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Résultats de cette session
          </h2>
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {completedAttempts.map((attempt: any) => (
              <Link 
                key={attempt.id} 
                href={`/dashboard/learning/${exercise.id}/result/${attempt.id}`}
                className="block p-4 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Score : {attempt.score} / {attempt.max_score}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString('fr-FR') : "Terminé"}
                    </p>
                  </div>
                  <div className="text-sm text-primary font-medium">Voir le détail &rarr;</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

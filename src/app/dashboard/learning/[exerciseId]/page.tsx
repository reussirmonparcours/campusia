import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PlayIcon, CheckCircle2, HistoryIcon, BookOpenIcon } from "lucide-react";
import StartAttemptButton from "./start-button";

interface PageProps {
  params: Promise<{ exerciseId: string }>;
}

export default async function ExerciseDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { exerciseId } = resolvedParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch exercise
  const { data: exercise, error } = await supabase
    .from("learning_exercises")
    .select(`
      id, title, description, difficulty, exercise_type, created_by,
      subjects ( name )
    `)
    .eq("id", exerciseId)
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .single();

  if (error || !exercise) {
    redirect("/dashboard/learning");
  }

  // Fetch questions count
  const { count: questionsCount } = await supabase
    .from("learning_questions")
    .select("*", { count: 'exact', head: true })
    .eq("exercise_id", exerciseId);

  // Fetch previous attempts
  const { data: attempts } = await supabase
    .from("learning_attempts")
    .select("id, status, score, max_score, started_at, completed_at")
    .eq("exercise_id", exerciseId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  const completedAttempts = attempts?.filter(a => a.status === 'completed') || [];
  const inProgressAttempt = attempts?.find(a => a.status === 'started');
  
  const bestScore = completedAttempts.length > 0 
    ? Math.max(...completedAttempts.map(a => a.score || 0)) 
    : null;
    
  const bestAttempt = completedAttempts.find(a => a.score === bestScore);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link 
          href="/dashboard/learning" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Retour aux exercices
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{exercise.title}</h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <BookOpenIcon className="h-4 w-4" /> 
          Matière : {(exercise.subjects as unknown as { name: string })?.name || "Général"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-lg p-6 bg-card shadow-sm">
            <h2 className="text-xl font-semibold mb-4">À propos de cet exercice</h2>
            <p className="text-card-foreground/80 mb-6">
              {exercise.description || "Aucune description fournie pour cet exercice."}
            </p>
            
            <div className="flex gap-4 mb-6">
              <div className="bg-muted px-4 py-3 rounded-md flex-1 text-center">
                <div className="text-sm text-muted-foreground">Questions</div>
                <div className="text-2xl font-bold">{questionsCount || 0}</div>
              </div>
              <div className="bg-muted px-4 py-3 rounded-md flex-1 text-center">
                <div className="text-sm text-muted-foreground">Difficulté</div>
                <div className="text-2xl font-bold capitalize">
                  {exercise.difficulty === 'easy' ? 'Facile' : exercise.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                </div>
              </div>
            </div>

            {inProgressAttempt ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-400">Tentative en cours</p>
                  <p className="text-sm text-amber-700 dark:text-amber-500">Vous avez une session non terminée.</p>
                </div>
                <Link 
                  href={`/dashboard/learning/${exerciseId}/attempt/${inProgressAttempt.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-md transition-colors"
                >
                  <PlayIcon className="h-4 w-4" />
                  Reprendre
                </Link>
              </div>
            ) : (
              <StartAttemptButton exerciseId={exerciseId} disabled={!questionsCount || questionsCount === 0} />
            )}
            
            {(!questionsCount || questionsCount === 0) && (
              <p className="text-sm text-destructive mt-2">Cet exercice ne contient aucune question.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 bg-card shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Performances
            </h2>
            
            {completedAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore terminé cet exercice.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Meilleur score</p>
                  <p className="text-3xl font-bold text-primary">
                    {bestScore} / {bestAttempt?.max_score}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tentatives terminées</p>
                  <p className="text-xl font-semibold">{completedAttempts.length}</p>
                </div>
              </div>
            )}
          </div>

          {completedAttempts.length > 0 && (
            <div className="border rounded-lg p-6 bg-card shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                Historique récent
              </h2>
              <div className="space-y-3">
                {completedAttempts.slice(0, 3).map(attempt => (
                  <Link 
                    key={attempt.id} 
                    href={`/dashboard/learning/${exerciseId}/result/${attempt.id}`}
                    className="block p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{attempt.score} / {attempt.max_score}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(attempt.completed_at!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-xs text-primary">Voir les détails →</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

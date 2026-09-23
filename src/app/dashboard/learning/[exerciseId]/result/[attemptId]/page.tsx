import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircle2, XCircle, AlertCircle, RotateCcw } from "lucide-react";
import { CoachChat } from "@/components/revision/CoachInteractive";

interface PageProps {
  params: Promise<{ exerciseId: string; attemptId: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { exerciseId, attemptId } = resolvedParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Attempt & Exercise
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .select(`
      id, status, score, max_score, completed_at,
      learning_exercises ( title )
    `)
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    redirect("/dashboard/learning");
  }

  if (attempt.status === "started") {
    // If still started, redirect to attempt page
    redirect(`/dashboard/learning/${exerciseId}/attempt/${attemptId}`);
  }

  // 2. Fetch Questions and Choices
  const { data: exercise } = await supabase
    .from("learning_exercises")
    .select(`
      learning_questions (
        id, question_type, content, explanation, order_index,
        learning_choices ( id, content, explanation, learning_choice_corrections ( is_correct ) )
      )
    `)
    .eq("id", exerciseId)
    .single();

  const questions = (exercise?.learning_questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
  );

  // 3. Fetch Answers
  const { data: answers } = await supabase
    .from("learning_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answersMap: Record<string, any> = {};
  answers?.forEach(ans => {
    answersMap[ans.question_id] = ans;
  });

  const percentage = attempt.max_score ? Math.round(((attempt.score || 0) / attempt.max_score) * 100) : 0;
  
  let scoreColor = "text-primary";
  if (percentage < 50) scoreColor = "text-destructive";
  else if (percentage < 70) scoreColor = "text-yellow-600 dark:text-yellow-500";
  else scoreColor = "text-green-600 dark:text-green-500";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <Link 
          href={`/dashboard/learning/${exerciseId}`} 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Retour à l&apos;exercice
        </Link>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <h1 className="text-3xl font-bold tracking-tight">Résultats : {(attempt.learning_exercises as any)?.title}</h1>
        <p className="text-muted-foreground mt-2">
          Terminé le {new Date(attempt.completed_at!).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border rounded-lg p-6 bg-card shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">Score Final</p>
          <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>
            {attempt.score} <span className="text-2xl text-muted-foreground">/ {attempt.max_score}</span>
          </div>
          <p className="text-sm font-medium">{percentage}% de réussite</p>
          
          <Link
            href={`/dashboard/learning/${exerciseId}`}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Link>
        </div>

        <div className="md:col-span-2 border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Détail des réponses</h2>
          <div className="space-y-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {questions.map((q: any, index: number) => {
              const ans = answersMap[q.id];
              const isCorrect = ans?.is_correct;
              const isFreeText = q.question_type === 'free_text';

              return (
                <div key={q.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="mt-1">
                      {isFreeText ? (
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                      ) : isCorrect === true ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Question {index + 1}</h3>
                      <p className="text-card-foreground mt-1">{q.content}</p>
                    </div>
                  </div>

                  <div className="ml-8 space-y-3">
                    {isFreeText ? (
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Votre réponse (Non évaluée)</p>
                        <p>{ans?.free_text_answer || <span className="italic text-muted-foreground">Aucune réponse fournie.</span>}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {q.learning_choices.map((choice: any) => {
                          const isSelected = ans?.choice_id === choice.id;
                          const isRight = choice.learning_choice_corrections?.is_correct;
                          
                          let bgClass = "bg-muted/50 border-transparent";
                          if (isSelected && isRight) bgClass = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-300";
                          else if (isSelected && !isRight) bgClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-300";
                          else if (!isSelected && isRight) bgClass = "bg-green-50 dark:bg-green-900/10 border-green-300 text-green-800 dark:text-green-400"; // Show the right one

                          return (
                            <div key={choice.id} className={`p-3 rounded-md border ${bgClass}`}>
                              <div className="flex items-center gap-2">
                                <span className="flex-1">{choice.content}</span>
                                {isSelected && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border">Votre choix</span>}
                                {isRight && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border">Bonne réponse</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(q.explanation || (isFreeText === false && ans?.choice_id && q.learning_choices.find((c: { id: string, explanation: string | null }) => c.id === ans.choice_id)?.explanation)) && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-900">
                        <span className="font-semibold block mb-1">Explication :</span>
                        {q.explanation}
                        {!isFreeText && ans?.choice_id && q.learning_choices.find((c: { id: string, explanation: string | null }) => c.id === ans.choice_id)?.explanation && (
                          <div className="mt-2">
                            {q.learning_choices.find((c: { id: string, explanation: string | null }) => c.id === ans.choice_id)?.explanation}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(!isFreeText && isCorrect === false || !ans || (!isFreeText && !ans.choice_id)) && (
                      <div className="mt-2">
                        <CoachChat attemptId={attemptId} questionId={q.id} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

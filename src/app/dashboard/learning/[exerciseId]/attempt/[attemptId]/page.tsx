import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuizEngine from "./quiz-engine";
import { ExerciseWithQuestions, QuestionWithChoices } from "@/types/learning";

interface PageProps {
  params: Promise<{ exerciseId: string; attemptId: string }>;
}

export default async function AttemptPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { exerciseId, attemptId } = resolvedParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Validate attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("learning_attempts")
    .select("id, status")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    redirect("/dashboard/learning");
  }

  if (attempt.status !== "started") {
    // If completed or abandoned, redirect to result
    redirect(`/dashboard/learning/${exerciseId}/result/${attemptId}`);
  }

  // 2. Fetch Exercise and all its questions with choices
  const { data: exercise, error: exError } = await supabase
    .from("learning_exercises")
    .select(`
      *,
      learning_questions (
        *,
        learning_choices ( id, question_id, content )
      )
    `)
    .eq("id", exerciseId)
    .single();

  if (exError || !exercise) {
    redirect("/dashboard/learning");
  }

  // 3. Fetch any existing answers for this attempt (in case of resume)
  const { data: existingAnswers } = await supabase
    .from("learning_answers")
    .select("question_id, choice_id, free_text_answer")
    .eq("attempt_id", attemptId);

  const initialAnswers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }> = {};
  existingAnswers?.forEach(ans => {
    initialAnswers[ans.question_id] = {
      choiceId: ans.choice_id,
      freeTextAnswer: ans.free_text_answer
    };
  });

  // Sort questions by order_index
  const questions = (exercise.learning_questions as unknown as QuestionWithChoices[]).sort(
    (a, b) => a.order_index - b.order_index
  );
  
  const typedExercise = {
    ...exercise,
    learning_questions: questions
  } as unknown as ExerciseWithQuestions;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <QuizEngine 
        exercise={typedExercise} 
        attemptId={attemptId}
        initialAnswers={initialAnswers}
      />
    </div>
  );
}

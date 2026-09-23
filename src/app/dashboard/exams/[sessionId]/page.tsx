import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getExamSessionDetails } from "@/lib/exam/queries";
import { ExamInstructions } from "@/components/exam/exam-instructions";
import { ExamSimulator } from "@/components/exam/exam-simulator";
import { ExamCompleted } from "@/components/exam/exam-completed";

interface ExamSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ExamSessionPage({ params }: ExamSessionPageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/dashboard/exams/${sessionId}`);
  }

  const details = await getExamSessionDetails(sessionId);

  if (!details) {
    redirect("/dashboard/exams");
  }

  const { session, exercise, questions, savedAnswers, attempt } = details;

  // 1. Session planifiée : affichage des consignes préalables
  if (session.status === "planned") {
    return (
      <ExamInstructions
        sessionId={session.id}
        exerciseTitle={exercise.title}
        subjectName={exercise.subject_name}
        durationMinutes={session.duration_minutes}
        totalQuestions={questions.length}
        difficulty={exercise.difficulty}
      />
    );
  }

  // 2. Session active : interface d'épreuve du simulateur
  if (session.status === "active") {
    return (
      <ExamSimulator
        sessionId={session.id}
        exerciseTitle={exercise.title}
        subjectName={exercise.subject_name}
        expiresAt={session.expires_at}
        questions={questions}
        initialAnswers={savedAnswers}
      />
    );
  }

  // 3. Session terminée (soumise ou expirée) : redirection vers la page de résultats
  if (session.status === "submitted" || session.status === "expired") {
    redirect(`/dashboard/exams/${sessionId}/results`);
  }

  // 4. Session abandonnée ou autre état clôturé : récapitulatif
  return (
    <ExamCompleted
      sessionId={session.id}
      status={session.status as "submitted" | "expired" | "abandoned"}
      exerciseTitle={exercise.title}
      subjectName={exercise.subject_name}
      totalQuestions={questions.length}
      durationMinutes={session.duration_minutes}
      completedAt={session.completed_at}
      score={attempt?.score ?? null}
      maxScore={attempt?.max_score ?? null}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEligibleExercises } from "@/lib/exam/queries";
import { ExamConfigForm } from "@/components/exam/exam-config-form";
import { ArrowLeft } from "lucide-react";

export default async function NewExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/exams/new");
  }

  const exercises = await getEligibleExercises();

  if (exercises.length === 0) {
    redirect("/dashboard/exams");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-navy-900 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux examens
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
          Nouvel examen blanc
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Configurez votre session d&apos;entraînement personnalisée selon vos objectifs de révision.
        </p>
      </div>

      <ExamConfigForm exercises={exercises} />
    </div>
  );
}

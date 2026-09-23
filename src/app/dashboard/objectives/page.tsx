import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";
import { redirect } from "next/navigation";
import { ObjectiveForm, ObjectiveList } from "./objective-components";

export default async function ObjectivesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/objectives");
  }

  const context = await getStudentAcademicContext(user.id);
  if (!context) {
    redirect("/onboarding");
  }

  const { data: objectives } = await supabase
    .from("student_objectives")
    .select("*")
    .eq("user_id", user.id)
    .order("status", { ascending: false }) // 'in_progress' comes before 'achieved'/'cancelled' alphabetically if we want, but better to sort by created_at or target_date
    .order("target_date", { ascending: true, nullsFirst: false });

  // Map database format to TS format
  const formattedObjectives = (objectives || []).map(obj => ({
    id: obj.id,
    userId: obj.user_id,
    subjectId: obj.subject_id,
    title: obj.title,
    objectiveType: obj.objective_type,
    status: obj.status,
    targetDate: obj.target_date,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mes Objectifs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Définissez vos objectifs d&apos;apprentissage et suivez votre progression.
        </p>
      </div>

      <ObjectiveForm subjects={context.progression.enrolledSubjects} />
      
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Vos objectifs</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ObjectiveList objectives={formattedObjectives as any} subjects={context.progression.enrolledSubjects} />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";
import { redirect } from "next/navigation";
import { SubjectCard } from "../subject-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/subjects");
  }

  const context = await getStudentAcademicContext(user.id);
  if (!context) {
    redirect("/onboarding");
  }

  const { progression } = context;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mes Matières
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gérez votre apprentissage et signalez vos difficultés.
        </p>
      </div>

      {progression.enrolledSubjects.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">
              Aucune matière n&apos;est actuellement assignée à ce semestre.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {progression.enrolledSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}

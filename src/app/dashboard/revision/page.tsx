import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenIcon } from "lucide-react";
import { StartRevisionSubjectButton } from "./start-revision-button";

export default async function RevisionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/revision");
  }

  const context = await getStudentAcademicContext(user.id);
  if (!context) {
    redirect("/onboarding");
  }

  const { progression } = context;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Moteur de Révision
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sélectionnez une matière pour cibler vos faiblesses grâce à l&apos;analyse de vos performances.
        </p>
      </div>

      {progression.enrolledSubjects.length === 0 ? (
        <Card className="border-dashed p-8 text-center bg-muted/30">
          <CardContent className="pt-6 flex flex-col items-center">
            <BookOpenIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Aucune matière disponible</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vous n&apos;avez aucune matière assignée pour ce semestre.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {progression.enrolledSubjects.map((subject) => (
            <Card key={subject.id} className="flex flex-col h-full bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl line-clamp-1">{subject.name}</CardTitle>
                <div className="text-xs font-semibold px-2 py-1 bg-secondary text-secondary-foreground rounded-full w-fit mt-2">
                  {subject.code || 'Matière'}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  Testez vos connaissances en ciblant vos points faibles pour cette matière.
                </p>
                <div className="mt-auto">
                  <StartRevisionSubjectButton subjectId={subject.id} subjectName={subject.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

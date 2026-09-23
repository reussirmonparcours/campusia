import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/onboarding");
  }

  // 1. Récupération du profil existant si déjà initialisé
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Récupération du catalogue de référence
  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, type, code, country")
    .order("name");

  const { data: academicUnits } = await supabase
    .from("academic_units")
    .select("id, institution_id, name, type, code")
    .order("name");

  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, cycle, academic_unit_id")
    .order("name");

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, name, code, program_id")
    .order("name");

  const { data: semesters } = await supabase
    .from("semesters")
    .select("id, program_id, semester_number, total_credits")
    .order("semester_number");

  // Fetch program_subjects to determine if a semester has tracks
  const { data: programSubjects } = await supabase
    .from("program_subjects")
    .select("semester_id, track_id");

  const specializedSemesterIds = Array.from(
    new Set(
      programSubjects
        ?.filter((ps) => ps.track_id !== null)
        .map((ps) => ps.semester_id) || []
    )
  );

  return (
    <main className="py-12">
      <Container size="md">
        <div className="mb-8 text-center space-y-2">
          <Badge variant="default">Onboarding Académique</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Configurez votre profil d&apos;apprentissage
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sélectionnez votre établissement et votre semestre d&apos;études actuel pour personnaliser vos cours et votre futur accompagnement IA.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Parcours étudiant FASEG</CardTitle>
            <CardDescription>
              Université de Lomé • Faculté des Sciences Économiques et de Gestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              initialProfile={profile}
              institutions={institutions ?? []}
              academicUnits={academicUnits ?? []}
              programs={programs ?? []}
              tracks={tracks ?? []}
              semesters={semesters ?? []}
              specializedSemesterIds={specializedSemesterIds}
              programSubjects={programSubjects ?? []}
            />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

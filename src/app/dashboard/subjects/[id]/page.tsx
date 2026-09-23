import { createClient } from "@/lib/supabase/server";
import { getStudentAcademicContext } from "@/lib/academic/context";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadDocumentDialog } from "./components/upload-document-dialog";
import { DocumentList } from "./components/document-list";
import { SubjectWorkspaceTabs } from "./components/subject-workspace-tabs";

export const maxDuration = 60;

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/subjects/" + id);
  }

  const context = await getStudentAcademicContext(user.id);
  if (!context) {
    redirect("/onboarding");
  }

  const subjectContext = context.progression.enrolledSubjects.find(s => s.id === id);
  
  if (!subjectContext) {
    redirect("/dashboard/subjects");
  }

  // Fetch activities for this specific subject
  const { data: activities } = await supabase
    .from("student_activities")
    .select("id, activity_type, description, created_at")
    .eq("user_id", user.id)
    .eq("subject_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch student documents for this subject
  const { data: documents } = await supabase
    .from("documents")
    .select("id, status, metadata, created_at")
    .eq("owner_id", user.id)
    .eq("subject_id", id)
    .eq("provenance", "STUDENT")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/subjects">
          <Button variant="outline" size="sm">
            &larr; Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {subjectContext.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-semibold text-slate-500">
              {subjectContext.code ?? "N/A"}
            </span>
            {subjectContext.credits && (
              <Badge variant="outline" className="text-[10px]">
                {subjectContext.credits} crédits
              </Badge>
            )}
            {subjectContext.isCustom && (
              <Badge variant="outline" className="text-[10px]">
                Mode Ouvert
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Column: Learning Status */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Niveau d&apos;apprentissage</p>
                <Badge variant={
                  subjectContext.learningStatus === "maitrisee" ? "success" : 
                  subjectContext.learningStatus === "a_reviser" ? "warning" : "default"
                }>
                  {subjectContext.learningStatus}
                </Badge>
              </div>
              
              {subjectContext.isFlaggedDifficult && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Signalement</p>
                  <Badge variant="warning">Difficulté signalée</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Workspace */}
        <div className="md:col-span-3">
          <SubjectWorkspaceTabs subjectId={id} activities={activities || []} documents={documents || []} />
        </div>
      </div>
    </div>
  );
}

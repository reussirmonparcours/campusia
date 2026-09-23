import { AIChatPanel } from "@/components/dashboard/ai/AIChatPanel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AISessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify ownership
  const { data: session } = await supabase
    .from("ai_sessions")
    .select("id, mode, subject_id, subjects(name)")
    .eq("id", params.sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    redirect("/dashboard/ai");
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto w-full mb-6">
        <Link href="/dashboard/ai" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux conversations
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {session.subjects ? (Array.isArray(session.subjects) ? session.subjects[0]?.name : (session.subjects as any).name) : "Conversation générale"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Mode : {session.mode}
        </p>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto flex items-start justify-center">
        <AIChatPanel initialSessionId={session.id} subjectId={session.subject_id} />
      </div>
    </div>
  );
}

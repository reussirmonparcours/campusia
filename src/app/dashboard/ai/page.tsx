import { AIChatPanel } from "@/components/dashboard/ai/AIChatPanel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, MessageSquare, Plus } from "lucide-react";

export default async function AIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: sessions } = await supabase
    .from("ai_sessions")
    .select("*, subjects(name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto w-full mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Centre d&apos;Apprentissage IA</h1>
        <p className="text-slate-600">
          Interagissez avec votre assistant intelligent. Il comprend votre parcours académique et s&apos;adapte à votre niveau.
        </p>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar: Historique */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Historique
            </h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {sessions?.map(session => (
              <Link 
                key={session.id} 
                href={`/dashboard/ai/${session.id}`}
                className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-emerald-300 transition-colors group flex items-start gap-3 text-left"
              >
                <MessageSquare className="w-4 h-4 mt-1 text-slate-400 group-hover:text-emerald-500" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {session.subjects ? (Array.isArray(session.subjects) ? session.subjects[0]?.name : (session.subjects as any).name) : "Conversation générale"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    Mode: {session.mode} • {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}

            {(!sessions || sessions.length === 0) && (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                Aucune conversation précédente.
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Nouvelle Session */}
        <div className="md:col-span-3 flex items-start justify-center">
          <div className="w-full max-w-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Démarrer une nouvelle discussion</h3>
            </div>
            <AIChatPanel />
          </div>
        </div>

      </div>
    </div>
  );
}

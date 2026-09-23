import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/activity");
  }

  // Fetch all activities with pagination later if needed. For M03, top 50 is fine.
  const { data: activities } = await supabase
    .from("student_activities")
    .select(`
      id,
      activity_type,
      description,
      provenance,
      created_at,
      subject_id,
      subject:subjects(name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mon Historique
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Journal de vos activités et de votre progression académique.
        </p>
      </div>

      {!activities || activities.length === 0 ? (
        <Card className="border-dashed p-8 text-center bg-transparent shadow-none">
          <p className="text-sm text-slate-500">
            Votre journal d&apos;apprentissage commence ici.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Complétez des objectifs ou révisez des matières pour voir votre activité.
          </p>
        </Card>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:border-slate-950 dark:bg-slate-900 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {activity.description}
                    </p>
                    <time className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {activity.subject && <Badge variant="outline" className="text-[10px]">{(activity.subject as any).name}</Badge>}
                    <Badge variant="outline" className="text-[10px] capitalize">{activity.provenance}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

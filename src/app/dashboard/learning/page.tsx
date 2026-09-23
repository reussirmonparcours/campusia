import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpenIcon, PlayIcon } from "lucide-react";

export default async function LearningDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch exercises available to the user (official ones or their own)
  const { data: exercises, error } = await supabase
    .from("learning_exercises")
    .select(`
      id, title, description, difficulty, exercise_type,
      subjects ( name )
    `)
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching exercises:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espace d&apos;apprentissage</h1>
          <p className="text-muted-foreground mt-1">
            Testez vos connaissances et progressez avec nos exercices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
            <BookOpenIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Aucun exercice disponible</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Les exercices officiels ou créés par vous apparaîtront ici.
            </p>
          </div>
        ) : (
          exercises?.map((ex) => (
            <div key={ex.id} className="border rounded-lg overflow-hidden flex flex-col bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(ex.subjects as any)?.name || "Général"}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ex.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    ex.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {ex.difficulty === 'easy' ? 'Facile' : ex.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{ex.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ex.description || "Aucune description fournie."}
                </p>
              </div>
              <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                <span className="text-sm text-muted-foreground capitalize">{ex.exercise_type}</span>
                <Link 
                  href={`/dashboard/learning/${ex.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                >
                  <PlayIcon className="h-4 w-4" />
                  Démarrer
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

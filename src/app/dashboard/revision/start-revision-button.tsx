"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon, Loader2 } from "lucide-react";
import { findOrCreateRevisionSession } from "@/lib/revision/actions";

export function StartRevisionSubjectButton({ subjectId, subjectName }: { subjectId: string, subjectName: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    setIsPending(true);
    setError(null);
    try {
      const result = await findOrCreateRevisionSession(subjectId);
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }
      if (result.data) {
        router.push(`/dashboard/revision/session/${result.data.id}`);
      }
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch mt-4">
      <button
        onClick={handleStart}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Démarrer une révision pour ${subjectName}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlayIcon className="h-4 w-4" />
        )}
        {isPending ? "Analyse en cours..." : "Réviser"}
      </button>
      {error && (
        <div className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

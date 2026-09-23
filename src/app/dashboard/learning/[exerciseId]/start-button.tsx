"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon, Loader2 } from "lucide-react";
import { startAttempt } from "@/lib/learning/actions";

interface StartAttemptButtonProps {
  exerciseId: string;
  disabled?: boolean;
}

export default function StartAttemptButton({ exerciseId, disabled = false }: StartAttemptButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    setIsPending(true);
    setError(null);
    
    try {
      const result = await startAttempt({ exerciseId });
      
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }
      
      if (result.data) {
        router.push(`/dashboard/learning/${exerciseId}/attempt/${result.data.id}`);
      }
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleStart}
        disabled={isPending || disabled}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlayIcon className="h-4 w-4" />
        )}
        {isPending ? "Démarrage..." : "Démarrer l'exercice"}
      </button>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

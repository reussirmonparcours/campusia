"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon, Loader2, RotateCcw } from "lucide-react";
import { startRevisionAttemptAction, closeRevisionSession } from "@/lib/revision/actions";

interface StartRevisionAttemptButtonProps {
  sessionId: string;
  exerciseId: string;
  disabled?: boolean;
}

export function StartRevisionAttemptButton({ sessionId, exerciseId, disabled = false }: StartRevisionAttemptButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    setIsPending(true);
    setError(null);
    try {
      const result = await startRevisionAttemptAction(sessionId, exerciseId);
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }
      if (result.data) {
        // Rediriger vers l'interface M04 existante avec le lien vers l'attemptId
        router.push(`/dashboard/learning/${exerciseId}/attempt/${result.data.attemptId}`);
      }
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto mt-4">
      <button
        onClick={handleStart}
        disabled={isPending || disabled}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PlayIcon className="h-5 w-5" />
        )}
        {isPending ? "Démarrage..." : "Commencer la révision"}
      </button>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export function CloseSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClose = async (status: 'completed' | 'abandoned') => {
    setIsPending(true);
    setError(null);
    try {
      const result = await closeRevisionSession(sessionId, status);
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }
      router.refresh(); // Refresh the page to reflect the closed state
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto mt-4">
      <div className="flex gap-2 w-full">
        <button
          onClick={() => handleClose('completed')}
          disabled={isPending}
          className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Marquer comme terminée
        </button>
        <button
          onClick={() => handleClose('abandoned')}
          disabled={isPending}
          title="Abandonner la session"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}

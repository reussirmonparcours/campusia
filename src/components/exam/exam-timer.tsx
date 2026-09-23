"use client";

import { useEffect, useState, memo } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  expiresAt: string | null;
  onExpire?: () => void;
  className?: string;
}

function formatRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const ExamTimer = memo(function ExamTimer({
  expiresAt,
  onExpire,
  className,
}: ExamTimerProps) {
  const calculateRemaining = () => {
    if (!expiresAt) return 0;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    if (!expiresAt) return;

    // Mise à jour immédiate
    const initialDiff = calculateRemaining();
    setRemaining(initialDiff);

    if (initialDiff <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const currentDiff = calculateRemaining();
      setRemaining(currentDiff);

      if (currentDiff <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const isUrgent = remaining > 0 && remaining <= 60; // Moins d'1 minute
  const isWarning = remaining > 60 && remaining <= 300; // Moins de 5 minutes
  const isExpired = remaining <= 0;

  return (
    <div
      role="timer"
      aria-label="Temps restant pour l'examen"
      aria-live={isUrgent ? "assertive" : "polite"}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-colors duration-normal select-none border",
        isExpired && "bg-error-bg text-error-text border-error-base/30",
        isUrgent && "bg-rose-50 text-rose-700 border-rose-400 animate-pulse",
        isWarning && "bg-amber-50 text-amber-800 border-amber-300",
        !isUrgent && !isWarning && !isExpired && "bg-surface-muted text-navy-900 border-border-default",
        className
      )}
    >
      {isUrgent || isWarning ? (
        <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" aria-hidden="true" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
      )}
      <span className="tracking-wider">
        {isExpired ? "00:00" : formatRemaining(remaining)}
      </span>
      {isExpired && (
        <span className="text-xs font-sans font-medium uppercase tracking-wider text-rose-700 ml-1">
          (Temps écoulé)
        </span>
      )}
    </div>
  );
});

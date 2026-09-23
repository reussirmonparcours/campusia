import * as React from "react";
import { Check, Circle } from "lucide-react";
import { PasswordEvaluation } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

export interface PasswordChecklistProps {
  evaluation: PasswordEvaluation;
  className?: string;
}

export function PasswordChecklist({ evaluation, className }: PasswordChecklistProps) {
  return (
    <div className={cn("space-y-2 rounded-lg border border-border-subtle bg-surface-muted/50 p-3 text-xs", className)}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-navy-950">Exigences de sécurité</span>
        <span className="text-[11px] text-text-muted">
          {evaluation.score} / {evaluation.rules.length} validées
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-1" aria-label="Critères du mot de passe">
        {evaluation.rules.map((rule) => {
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-start gap-2 transition-colors duration-fast",
                rule.isMet
                  ? "text-success-text font-medium"
                  : "text-text-muted"
              )}
            >
              {rule.isMet ? (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-base mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                </div>
              ) : (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-300 mt-0.5">
                  <Circle className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-col leading-tight">
                <span className={cn(rule.isMet && "text-emerald-800")}>{rule.label}</span>
                {rule.hint && (
                  <span className="text-[10px] text-text-muted font-normal mt-0.5">
                    {rule.hint}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

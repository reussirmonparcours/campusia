import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline" | "accent" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-muted text-text-primary",
    neutral: "bg-surface-muted text-text-secondary",
    success: "bg-success-bg text-success-text",
    warning: "bg-warning-bg text-warning-text",
    error: "bg-error-bg text-error-text",
    info: "bg-info-bg text-info-text",
    accent: "bg-gold-200 text-gold-950",
    outline: "border border-border-default text-text-secondary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

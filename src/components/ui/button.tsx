import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none duration-fast";

    const variantStyles = {
      primary: "bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-500 shadow-subtle",
      accent: "bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:ring-gold-500 shadow-subtle",
      secondary: "bg-surface-muted text-text-primary hover:bg-border-default focus-visible:ring-navy-400",
      outline: "border border-border-default bg-transparent text-text-primary hover:bg-bg-base focus-visible:ring-navy-400",
      ghost: "bg-transparent text-text-secondary hover:bg-surface-muted focus-visible:ring-navy-400",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2 h-10",
      lg: "text-base px-6 py-2.5 h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

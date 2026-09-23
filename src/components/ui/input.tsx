import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, rightElement, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-fast focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:cursor-not-allowed disabled:opacity-50",
              rightElement && "pr-11",
              error && "border-error-base focus:border-error-base focus:ring-error-base",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-0 flex h-full items-center pr-2.5">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-error-base font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

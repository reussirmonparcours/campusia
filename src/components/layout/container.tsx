import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({ className, size = "lg", ...props }: ContainerProps) {
  const sizeStyles = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeStyles[size], className)}
      {...props}
    />
  );
}

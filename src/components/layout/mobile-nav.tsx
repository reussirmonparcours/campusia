"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavigation } from "@/config/navigation";

export function MobileNav() {
  const pathname = usePathname();

  // Masquer la navigation mobile sur les sessions d'examen pour éviter toute distraction ou fausse manipulation
  const isExamSession = pathname.startsWith("/dashboard/exams/") && pathname !== "/dashboard/exams/new";
  if (isExamSession) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-base border-t border-border-default pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center justify-around h-16 px-2" aria-label="Navigation principale mobile">
        {mainNavigation.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-lg",
                isActive ? "text-navy-900" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <div className={cn(
                "p-1 rounded-full transition-colors",
                isActive && "bg-gold-50"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "text-gold-600" : "")} aria-hidden="true" />
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

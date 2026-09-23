"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavigation } from "@/config/navigation";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden md:flex items-center space-x-1 lg:space-x-2", className)}>
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
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
              isActive
                ? "bg-navy-50 text-navy-900"
                : "text-text-secondary hover:text-navy-900 hover:bg-surface-muted"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive ? "text-navy-700" : "text-text-muted")} aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

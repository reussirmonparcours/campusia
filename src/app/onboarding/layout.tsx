import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1 pb-20 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}

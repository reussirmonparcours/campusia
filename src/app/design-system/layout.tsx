import * as React from "react";
import { PublicHeader } from "@/components/layout/public-header";

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

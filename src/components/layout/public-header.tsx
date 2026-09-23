import * as React from "react";
import { Container } from "./container";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PublicNav } from "./public-nav";

export function PublicHeader() {
  return (
    <header className="border-b border-border-default bg-surface-base/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <Container className="flex h-16 items-center justify-between relative">
        <div className="flex items-center gap-8">
          <BrandLogo />
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          <PublicNav />
        </div>
      </Container>
    </header>
  );
}

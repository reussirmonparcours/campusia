import * as React from "react";
import { Container } from "./container";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/server";

export async function AppHeader() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return (
    <header className="border-b border-border-default bg-surface-base/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <Container className="flex h-16 items-center justify-between relative">
        <div className="flex items-center gap-8">
          <BrandLogo />
          <MainNav />
        </div>

        <div className="flex items-center space-x-4">
          <UserNav user={user} />
        </div>
      </Container>
    </header>
  );
}

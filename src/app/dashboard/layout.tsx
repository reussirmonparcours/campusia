import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1 pb-20 md:pb-0 relative">
        <Container className="py-8">
          <main className="mx-auto w-full max-w-5xl">
            {children}
          </main>
        </Container>
      </div>
      <MobileNav />
    </div>
  );
}

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy / Middleware
 * Gère l'accès aux routes protégées et le rafraîchissement des sessions.
 *
 * RÈGLES DE ROUTING STRICTES (M07) :
 * 1. Les routes publiques (/ , /auth/*) sont directement accessibles :
 *    AUCUNE redirection arbitraire vers /dashboard depuis ces routes.
 * 2. Les routes protégées (/dashboard/*, /onboarding) sont inaccessibles aux utilisateurs
 *    non authentifiés -> Redirection vers /auth/login avec conservation du redirectTo.
 * 3. Les requêtes sur les routes publiques ne bloquent jamais sur des appels réseau Supabase,
 *    garantissant une navigation immédiate et sans lag.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  // Détection rapide de la présence d'un cookie d'authentification Supabase valide
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.includes("-auth-token") &&
        c.value.trim().length > 0
    );

  // 1. Accès non authentifié aux routes protégées -> Redirection vers /auth/login
  if (isProtectedPath && !hasAuthCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Rafraîchissement de session uniquement sur les routes protégées ou le callback d'authentification
  if (isProtectedPath || pathname.startsWith("/auth/callback")) {
    return await updateSession(request);
  }

  // 3. Toutes les routes publiques passent immédiatement sans latence réseau
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

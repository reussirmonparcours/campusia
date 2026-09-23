import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const isResetPasswordFlow = next.startsWith("/auth/reset-password");

  if (error) {
    if (isResetPasswordFlow) {
      return NextResponse.redirect(
        `${origin}/auth/reset-password?error=${encodeURIComponent(
          errorDescription || "Le lien de réinitialisation est invalide ou a expiré."
        )}`
      );
    }
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    if (isResetPasswordFlow) {
      return NextResponse.redirect(
        `${origin}/auth/reset-password?error=${encodeURIComponent(
          "Ce lien de réinitialisation a expiré ou a déjà été utilisé. Veuillez effectuer une nouvelle demande."
        )}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

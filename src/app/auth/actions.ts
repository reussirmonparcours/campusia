"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth/password-policy";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  if (host) {
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function sanitizeAuthError(rawMessage?: string): string {
  if (!rawMessage) return "Une erreur est survenue. Veuillez réessayer.";

  const lower = rawMessage.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Les informations de connexion ne correspondent pas.";
  }
  if (lower.includes("email not confirmed")) {
    return "Veuillez confirmer votre adresse email avant de vous connecter.";
  }
  if (lower.includes("user already registered") || lower.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Trop de tentatives. Veuillez patienter un instant avant de réessayer.";
  }
  if (lower.includes("password should be at least")) {
    return "Le mot de passe ne respecte pas les critères de sécurité requis.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Problème de connexion réseau. Veuillez vérifier votre connexion.";
  }
  if (lower.includes("session") || lower.includes("unauthorized") || lower.includes("auth session missing")) {
    return "Votre session de récupération est invalide ou a expiré. Veuillez refaire une demande de réinitialisation.";
  }

  return "Une erreur est survenue. Veuillez réessayer ultérieurement.";
}

export async function signIn(prevState: unknown, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données de connexion invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: sanitizeAuthError(error.message) };
  }

  // Vérification de l'onboarding étudiant
  if (data.user) {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_track_id, current_semester_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!profile?.current_track_id || !profile?.current_semester_id) {
      redirect("/onboarding");
    }
  }

  redirect("/dashboard");
}

export async function signUp(prevState: unknown, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  const parsed = registerSchema.safeParse({ email, password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Formulaire incomplet ou invalide" };
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: sanitizeAuthError(error.message) };
  }

  // Si session immédiate (email confirmation désactivée)
  if (data.session) {
    redirect("/onboarding");
  }

  // Si email de confirmation requis
  return {
    success: true,
    requiresEmailVerification: true,
    email: parsed.data.email,
    message: "Un email de confirmation vous a été envoyé. Consultez votre boîte de réception pour activer votre compte.",
  };
}

export async function resendVerificationEmail(email: string) {
  if (!email || !email.includes("@")) {
    return { error: "Adresse email invalide" };
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: sanitizeAuthError(error.message) };
  }

  return {
    success: true,
    message: "Nouvel email de confirmation envoyé. Veuillez vérifier votre boîte de réception.",
  };
}

export async function forgotPassword(prevState: unknown, formData: FormData) {
  const email = formData.get("email");

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Adresse email invalide" };
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    // Ne pas exposer les détails techniques
    return {
      success: true,
      message: "Si cette adresse correspond à un compte, vous recevrez un email permettant de réinitialiser votre mot de passe.",
    };
  }

  return {
    success: true,
    message: "Si cette adresse correspond à un compte, vous recevrez un email permettant de réinitialiser votre mot de passe.",
  };
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Mot de passe non conforme" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Votre lien de réinitialisation a expiré ou est invalide. Veuillez effectuer une nouvelle demande de réinitialisation.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: sanitizeAuthError(error.message) };
  }

  // Déconnexion propre de la session temporaire de récupération
  await supabase.auth.signOut();

  return {
    success: true,
    message: "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

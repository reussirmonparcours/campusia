"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "../actions";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginContent() {
  const [state, formAction, isPending] = React.useActionState(signIn, null);
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const displayError =
    state?.error ||
    googleError ||
    (callbackError === "auth_callback_failed"
      ? "La validation de votre session a échoué. Veuillez vous reconnecter."
      : null);

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <Card className="shadow-strong border-border-default bg-white p-2 sm:p-4">
      <CardHeader className="space-y-1.5 text-center sm:text-left">
        <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
          Bienvenue sur MonParcours
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-text-secondary">
          Reprenez votre parcours là où vous l&apos;avez laissé.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {/* Error Alert */}
        {displayError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 text-xs text-error-text bg-error-bg border border-rose-200 rounded-lg"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-error-base mt-0.5" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Login Form */}
        <form action={formAction} className="space-y-4">
          <Input
            label="Adresse email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="etudiant@univ-lome.tg"
          />

          <div className="space-y-1">
            <Input
              label="Mot de passe"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="p-1.5 text-text-muted hover:text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              }
            />

            <div className="flex justify-end pt-1">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-navy-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isPending}
            className="w-full h-11 justify-center font-semibold shadow-subtle mt-2"
          >
            {isPending ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-border-default" />
          <span className="bg-white px-3 text-xs uppercase tracking-wider text-text-muted">
            ou
          </span>
        </div>

        {/* Google OAuth Button */}
        <GoogleButton onError={(err) => setGoogleError(err)} disabled={isPending} />

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-text-secondary pt-2">
          Vous n&apos;avez pas encore de compte ?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-navy-900 hover:text-gold-700 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            Créer mon compte
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <React.Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-surface-muted" />}>
        <LoginContent />
      </React.Suspense>
    </AuthLayout>
  );
}

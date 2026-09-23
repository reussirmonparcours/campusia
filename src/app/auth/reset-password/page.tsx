"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "../actions";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = React.useActionState(resetPassword, null);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const urlError = searchParams.get("error");
  const code = searchParams.get("code");
  const isExchangingCode = Boolean(code);

  // Détection d'un code PKCE dans l'URL directe (ex: ancien lien direct)
  React.useEffect(() => {
    if (code) {
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=/auth/reset-password`);
    }
  }, [code, router]);

  // Synchronisation de la session de récupération côté client
  React.useEffect(() => {
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          // Événement de récupération bien capturé
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignorer si contexte non navigateur
    }
  }, []);

  // Real-time evaluation using single source of truth
  const passwordEvaluation = React.useMemo(() => {
    return evaluatePassword(password);
  }, [password]);

  const hasStartedConfirm = confirmPassword.length > 0;
  const isMatch = hasStartedConfirm && password === confirmPassword;
  const isMismatch = hasStartedConfirm && password !== confirmPassword;

  const isFormValid = passwordEvaluation.isValid && isMatch;
  const displayError = state?.error || urlError;

  if (isExchangingCode) {
    return (
      <Card className="shadow-strong border-border-default bg-white p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-navy-600" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-navy-950">
              Vérification de votre lien sécurisé...
            </h3>
            <p className="text-xs text-text-secondary">
              Veuillez patienter pendant la validation de votre session de récupération.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-strong border-border-default bg-white p-2 sm:p-4">
      <CardHeader className="space-y-1.5 text-center sm:text-left">
        <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
          Définir un nouveau mot de passe
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-text-secondary">
          Choisissez un nouveau mot de passe respectant les normes de sécurité.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {/* Error Message */}
        {displayError && (
          <div
            role="alert"
            className="space-y-2 p-3 text-xs text-error-text bg-error-bg border border-rose-200 rounded-lg"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-error-base mt-0.5" aria-hidden="true" />
              <span>{displayError}</span>
            </div>
            {displayError.includes("expiré") || displayError.includes("invalide") ? (
              <div className="pt-1 pl-6.5">
                <Link
                  href="/auth/forgot-password"
                  className="font-semibold text-navy-900 hover:text-navy-950 underline underline-offset-2"
                >
                  Demander un nouveau lien de réinitialisation &rarr;
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {/* Success Screen */}
        {state?.success ? (
          <div className="space-y-5 text-center py-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-navy-950">
                Mot de passe mis à jour
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                {state.message}
              </p>
            </div>

            <Link href="/auth/login" className="inline-flex w-full">
              <Button variant="primary" size="md" className="w-full justify-center gap-2">
                Se connecter avec le nouveau mot de passe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Input
                label="Nouveau mot de passe"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Saisissez un mot de passe robuste"
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

              {/* Password Checklist */}
              <PasswordChecklist evaluation={passwordEvaluation} />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Input
                label="Confirmer le nouveau mot de passe"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Répétez le nouveau mot de passe"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
                    className="p-1.5 text-text-muted hover:text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
              />

              {isMatch && (
                <p className="flex items-center gap-1.5 text-xs text-success-text font-medium pt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-base" aria-hidden="true" />
                  Les mots de passe correspondent
                </p>
              )}
              {isMismatch && (
                <p className="flex items-center gap-1.5 text-xs text-error-base font-medium pt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-error-base" aria-hidden="true" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isPending}
              className="w-full h-11 justify-center font-semibold shadow-subtle mt-2"
            >
              {isPending ? "Mise à jour en cours..." : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <React.Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-surface-muted" />}>
        <ResetPasswordForm />
      </React.Suspense>
    </AuthLayout>
  );
}

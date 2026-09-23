"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, resendVerificationEmail } from "../actions";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { GoogleButton } from "@/components/auth/google-button";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Mail, RotateCw, ArrowRight } from "lucide-react";

function RegisterContent() {
  const [state, formAction, isPending] = React.useActionState(signUp, null);
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  // Form State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  // Resend Email State
  const [resendPending, setResendPending] = React.useState(false);
  const [resendFeedback, setResendFeedback] = React.useState<string | null>(null);

  // Password Real-time Evaluation
  const passwordEvaluation = React.useMemo(() => {
    return evaluatePassword(password);
  }, [password]);

  // Match validation
  const hasStartedConfirm = confirmPassword.length > 0;
  const isMatch = hasStartedConfirm && password === confirmPassword;
  const isMismatch = hasStartedConfirm && password !== confirmPassword;

  // Global validity
  const isEmailValid = email.trim().length > 3 && email.includes("@") && email.includes(".");
  const isFormValid = isEmailValid && passwordEvaluation.isValid && isMatch;

  const handleResend = async () => {
    const targetEmail = state?.email || email;
    if (!targetEmail) return;

    setResendPending(true);
    setResendFeedback(null);
    try {
      const result = await resendVerificationEmail(targetEmail);
      if (result.error) {
        setResendFeedback(result.error);
      } else {
        setResendFeedback(result.message || "Email renvoyé avec succès.");
      }
    } catch {
      setResendFeedback("Impossible de renvoyer l'email pour le moment.");
    } finally {
      setResendPending(false);
    }
  };

  // Dedicated Screen if Email Verification is Required
  if (state?.requiresEmailVerification) {
    return (
      <Card className="shadow-strong border-border-default bg-white p-2 sm:p-4 text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-navy-800">
            <Mail className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
            Vérifiez votre adresse email
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary max-w-sm mx-auto">
            Un email de confirmation a été envoyé à{" "}
            <strong className="text-navy-950 font-semibold">{state.email}</strong>.
            Consultez votre boîte de réception pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {resendFeedback && (
            <div className="p-3 text-xs text-navy-900 bg-navy-50 border border-navy-200 rounded-lg">
              {resendFeedback}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResend}
              disabled={resendPending}
              className="w-full justify-center gap-2"
            >
              <RotateCw className={`h-4 w-4 ${resendPending ? "animate-spin" : ""}`} />
              {resendPending ? "Envoi en cours..." : "Renvoyer l'email de confirmation"}
            </Button>

            <Link href="/auth/login" className="w-full">
              <Button variant="primary" size="md" className="w-full justify-center gap-2">
                Aller à la connexion
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-text-muted">
            Vérifiez également votre dossier de courriers indésirables (spams).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-strong border-border-default bg-white p-2 sm:p-4">
      <CardHeader className="space-y-2 text-center sm:text-left">
        {planParam === "essential" && (
          <Badge variant="default" className="w-fit text-[11px] font-medium">
            Formule sélectionnée : Essentiel
          </Badge>
        )}
        {planParam === "complete" && (
          <Badge variant="accent" className="w-fit text-[11px] font-semibold">
            Formule sélectionnée : Complet
          </Badge>
        )}
        <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
          Créez votre compte
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-text-secondary">
          Rejoignez MonParcours et démarrez votre apprentissage structuré.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {/* Server Error Message */}
        {state?.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 text-xs text-error-text bg-error-bg border border-rose-200 rounded-lg"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-error-base mt-0.5" aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Google Client Error Message */}
        {googleError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 text-xs text-warning-text bg-warning-bg border border-amber-200 rounded-lg"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-warning-base mt-0.5" aria-hidden="true" />
            <span>{googleError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form action={formAction} className="space-y-4">
          {planParam && <input type="hidden" name="selected_plan" value={planParam} />}

          {/* Email Field */}
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

          {/* Password Field */}
          <div className="space-y-2">
            <Input
              label="Mot de passe"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Créez un mot de passe robuste"
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

            {/* Real-time Checklist */}
            <PasswordChecklist evaluation={passwordEvaluation} />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Répétez votre mot de passe"
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

            {/* Real-time match feedback */}
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isPending}
            className="w-full h-11 justify-center font-semibold shadow-subtle mt-2"
          >
            {isPending ? "Création du compte..." : "Créer mon compte"}
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

        {/* Login Link */}
        <div className="mt-6 text-center text-xs text-text-secondary pt-2">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-navy-900 hover:text-gold-700 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            Connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <React.Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-surface-muted" />}>
        <RegisterContent />
      </React.Suspense>
    </AuthLayout>
  );
}

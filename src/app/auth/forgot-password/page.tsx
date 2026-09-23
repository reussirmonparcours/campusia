"use client";

import * as React from "react";
import Link from "next/link";
import { forgotPassword } from "../actions";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = React.useActionState(forgotPassword, null);
  const [email, setEmail] = React.useState("");

  const isFormValid = email.trim().length > 3 && email.includes("@");

  return (
    <AuthLayout>
      <Card className="shadow-strong border-border-default bg-white p-2 sm:p-4">
        <CardHeader className="space-y-1.5 text-center sm:text-left">
          <CardTitle className="text-xl sm:text-2xl font-bold text-navy-950">
            Réinitialiser votre mot de passe
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-text-secondary">
            Saisissez votre adresse email institutionnelle pour recevoir les instructions de réinitialisation.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Error Message */}
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 text-xs text-error-text bg-error-bg border border-rose-200 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-error-base mt-0.5" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Success Neutral Notice */}
          {state?.success ? (
            <div className="space-y-5 text-center py-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-800">
                <Mail className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-navy-950">Email envoyé</h3>
                <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                  {state.message}
                </p>
              </div>

              <Link href="/auth/login" className="inline-flex w-full">
                <Button variant="outline" size="md" className="w-full justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
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
                helperText="Un lien sécurisé à usage unique vous sera envoyé."
              />

              <Button
                type="submit"
                disabled={!isFormValid || isPending}
                className="w-full h-11 justify-center font-semibold shadow-subtle mt-2"
              >
                {isPending ? "Envoi du lien..." : "Envoyer le lien"}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

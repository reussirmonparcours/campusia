"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log generic error message without exposing sensitive trace to users
    console.error("[MonParcours Error Boundary]", error.message);
  }, [error]);

  return (
    <main className="py-20">
      <Container size="sm">
        <Card className="border-red-200 dark:border-red-950">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Une erreur est survenue</CardTitle>
            <CardDescription>
              L&apos;application a rencontré une interruption inattendue. Aucune donnée sensible n&apos;est compromise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Code de référence : {error.digest || "ERR_APPLICATION_GENERIC"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="primary" onClick={() => reset()}>
              Réessayer
            </Button>
          </CardFooter>
        </Card>
      </Container>
    </main>
  );
}

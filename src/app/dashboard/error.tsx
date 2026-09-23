"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log minimal error information securely without exposing to UI
    console.error("Dashboard error occurred:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md border-border-default bg-surface-base p-6 text-center shadow-subtle">
        <CardContent className="space-y-4 p-0">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-navy-950">
              Chargement interrompu
            </h1>
            <p className="text-sm text-text-secondary">
              Une erreur inattendue est survenue lors de la récupération de votre tableau de bord. Vos données restent sécurisées.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Button
              onClick={reset}
              variant="primary"
              size="md"
              className="gap-2 min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Réessayer
            </Button>
            <Link href="/" className="inline-flex min-h-[44px] items-center justify-center">
              <Button
                variant="outline"
                size="md"
                className="w-full gap-2 min-h-[44px]"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

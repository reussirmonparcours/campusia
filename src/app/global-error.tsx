"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[MonParcours Global Error]", error.message);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans antialiased text-slate-900">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-red-700">Erreur critique du système</h2>
          <p className="text-sm text-slate-600">
            Une erreur critique est survenue lors de l&apos;initialisation de la page.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  );
}

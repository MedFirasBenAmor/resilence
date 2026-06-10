"use client";

import { ErrorState } from "@/components/ui/error-state";

type StudentDashboardErrorProps = {
  error: Error;
  reset: () => void;
};

export default function StudentDashboardError({
  error,
  reset,
}: StudentDashboardErrorProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="space-y-4">
        <ErrorState
          title="Impossible de charger le tableau de bord étudiant"
          description="Une erreur inattendue empêche la consolidation de vos priorités du moment."
        />
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Reessayer
        </button>
        {process.env.NODE_ENV === "development" ? (
          <p className="text-xs text-slate-500">{error.message}</p>
        ) : null}
      </div>
    </main>
  );
}

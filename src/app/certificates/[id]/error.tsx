"use client";

import { ErrorState } from "@/components/ui/error-state";

type CertificateErrorProps = {
  error: Error;
  reset: () => void;
};

export default function CertificateError({
  error,
  reset,
}: CertificateErrorProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="space-y-4">
        <ErrorState
          title="Impossible de charger cette attestation"
          description="La vérification ne peut pas être affichée pour le moment."
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

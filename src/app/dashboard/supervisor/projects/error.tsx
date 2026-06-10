"use client";

type SupervisorProjectsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function SupervisorProjectsError({
  error,
  reset,
}: SupervisorProjectsErrorProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
          Erreur
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Impossible de charger les projets supervises
        </h1>
        <p className="mt-4 text-sm text-slate-600">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Reessayer
        </button>
      </div>
    </main>
  );
}

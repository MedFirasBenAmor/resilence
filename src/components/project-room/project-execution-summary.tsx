import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type AttentionItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: "warning" | "danger" | "info" | "success";
};

type ProjectExecutionSummaryProps = {
  items: AttentionItem[];
};

export function ProjectExecutionSummary({
  items,
}: ProjectExecutionSummaryProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Aucune alerte immédiate"
        description="Le projet avance sans blocage critique. Consultez les tâches et les livrables pour préparer la prochaine étape."
      />
    );
  }

  return (
    <section className="app-panel p-6">
      <p className="app-eyebrow">Attention now</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Ce qui demande votre attention maintenant
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Priorisez ce qui débloque l&apos;avancement du projet, la revue ou la prochaine livraison.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          {items.length} point{items.length > 1 ? "s" : ""} à traiter
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.92)_100%)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.label}
              </p>
              <StatusBadge label={item.tone === "danger" ? "Urgent" : item.tone === "warning" ? "À suivre" : item.tone === "info" ? "En cours" : "OK"} tone={item.tone} />
            </div>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { EmptyState } from "@/components/ui/empty-state";

type FeedbackItem = {
  id: string;
  sourceLabel: string;
  title: string;
  body: string;
  createdAt: Date;
};

type ProjectRoomRecentFeedbackProps = {
  items: FeedbackItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ProjectRoomRecentFeedback({
  items,
}: ProjectRoomRecentFeedbackProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Pas encore de feedback récent"
        description="Dès qu'une relecture ou un commentaire de suivi est publié, il remonte ici pour aider l'équipe à agir rapidement."
      />
    );
  }

  return (
    <section className="app-panel p-6">
      <p className="app-eyebrow">Signals</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Feedback récent
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Les retours visibles sans devoir descendre dans les listes.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-[1.6rem] border border-slate-200 bg-white/92 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                {item.sourceLabel}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

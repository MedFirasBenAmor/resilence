import { EmptyState } from "@/components/ui/empty-state";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  tone: "neutral" | "info" | "success" | "warning";
};

type ProjectRoomActivityFeedProps = {
  items: ActivityItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const toneClassNames: Record<ActivityItem["tone"], string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

export function ProjectRoomActivityFeed({
  items,
}: ProjectRoomActivityFeedProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Aucune activité récente"
        description="Quand une tâche bouge, qu'un livrable est soumis ou qu'un commentaire est publié, l'historique apparaîtra ici."
      />
    );
  }

  return (
    <section className="app-panel p-6">
      <p className="app-eyebrow">Timeline</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        Activité récente
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Les derniers événements utiles pour reprendre le projet rapidement.
      </p>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="relative rounded-[1.5rem] border border-slate-200/90 bg-white/90 p-4 pl-6 shadow-sm">
            <span className={`absolute left-4 top-6 h-2.5 w-2.5 rounded-full ${toneClassNames[item.tone]}`} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

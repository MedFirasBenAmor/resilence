import Link from "next/link";
import { cn } from "@/lib/ui/cn";

type DeadlineItem = {
  id: string;
  title: string;
  dueDate: Date | null;
  projectTitle: string;
  href: string;
  statusLabel: string;
  tone?: "normal" | "warning" | "overdue";
};

type DeadlineListProps = {
  items: DeadlineItem[];
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Pas de date";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function getToneClass(tone: DeadlineItem["tone"]) {
  if (tone === "overdue") return "border-rose-200 bg-rose-50/92";
  if (tone === "warning") return "border-amber-200 bg-amber-50/92";
  return "border-slate-200 bg-slate-50/86";
}

export function DeadlineList({ items }: DeadlineListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn("rounded-2xl border p-4 transition hover:-translate-y-0.5", getToneClass(item.tone))}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.projectTitle}</p>
              <p className="mt-2 text-xs text-slate-500">
                {item.statusLabel} • {formatDate(item.dueDate)}
              </p>
            </div>
            <Link
              href={item.href}
              className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
            >
              Ouvrir
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

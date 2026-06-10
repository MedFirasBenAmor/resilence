import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type DataListItem = {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  href?: string;
};

type DataListProps = {
  items: DataListItem[];
};

export function DataList({ items }: DataListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="app-panel-muted app-hover-card p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              ) : null}
              {item.meta ? <p className="mt-2 text-xs text-slate-500">{item.meta}</p> : null}
            </div>
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "app-button-secondary shrink-0 px-3 py-2 text-xs",
                )}
              >
                Ouvrir
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

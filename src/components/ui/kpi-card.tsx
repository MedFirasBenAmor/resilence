import { cn } from "@/lib/ui/cn";

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
};

export function KpiCard({ label, value, hint, className }: KpiCardProps) {
  return (
    <article
      className={cn(
        "app-stat-card app-hover-card app-fade-in-up overflow-hidden p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-emerald-100/90 bg-[linear-gradient(135deg,_rgba(186,230,253,0.72),_rgba(209,250,229,0.84))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full bg-emerald-400/85 shadow-[0_0_0_5px_rgba(255,255,255,0.56)]" />
        </span>
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p> : null}
    </article>
  );
}

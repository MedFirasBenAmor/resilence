import { cn } from "@/lib/ui/cn";

type ProgressMetricProps = {
  label: string;
  value: number;
  max?: number;
  className?: string;
};

export function ProgressMetric({
  label,
  value,
  max = 5,
  className,
}: ProgressMetricProps) {
  const safeValue = Math.max(0, Math.min(value, max));
  const percentage = (safeValue / max) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-sm font-semibold text-slate-500">{safeValue.toFixed(1)} / {max}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,_#0ea5e9_0%,_#10b981_100%)] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

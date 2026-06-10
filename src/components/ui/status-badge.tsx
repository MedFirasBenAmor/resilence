import type { ReactNode } from "react";
import { type UiTone } from "@/lib/ui/status-labels";
import { cn } from "@/lib/ui/cn";

type StatusBadgeProps = {
  label: ReactNode;
  tone?: UiTone;
};

const TONE_STYLES: Record<UiTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  accent: "border-indigo-200 bg-indigo-50 text-indigo-800",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
        TONE_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}

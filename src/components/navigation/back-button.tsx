"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/ui/cn";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackHref,
  label = "Retour",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-950",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M10.78 4.22a.75.75 0 0 1 0 1.06L6.81 9.25H16a.75.75 0 0 1 0 1.5H6.81l3.97 3.97a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}

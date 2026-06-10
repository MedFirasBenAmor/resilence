import Link from "next/link";

type PriorityTone = "warning" | "success" | "danger" | "neutral";

export type PriorityAction = {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  tone: PriorityTone;
  eyebrow: string;
};

const toneStyles: Record<PriorityTone, string> = {
  warning:
    "border-amber-200 bg-[linear-gradient(155deg,_rgba(255,251,235,1),_rgba(255,247,237,0.98))] shadow-[0_18px_45px_rgba(245,158,11,0.10)]",
  success:
    "border-emerald-200 bg-[linear-gradient(145deg,_rgba(236,253,245,0.98),_rgba(255,255,255,0.98))]",
  danger:
    "border-rose-200 bg-[linear-gradient(145deg,_rgba(255,241,242,0.98),_rgba(255,255,255,0.98))]",
  neutral:
    "border-slate-200 bg-[linear-gradient(145deg,_rgba(248,250,252,0.98),_rgba(255,255,255,0.98))]",
};

const dotStyles: Record<PriorityTone, string> = {
  warning: "bg-amber-400",
  success: "bg-emerald-400",
  danger: "bg-rose-400",
  neutral: "bg-slate-400",
};

export function PriorityActionCard({ action }: { action: PriorityAction }) {
  return (
    <section className={`rounded-[2rem] border p-6 ${toneStyles[action.tone]}`}>
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${dotStyles[action.tone]}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {action.eyebrow}
        </p>
      </div>
      <h3 className="mt-5 text-[1.9rem] font-semibold leading-tight tracking-tight text-slate-950">
        {action.title}
      </h3>
      <p className="mt-4 text-sm leading-7 text-slate-600">{action.description}</p>
      <div className="mt-6 rounded-[1.4rem] border border-amber-200/80 bg-white/72 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
          A faire maintenant
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Cette action est celle qui débloque le plus vite la suite de votre parcours.
        </p>
      </div>
      <div className="mt-6">
        <Link href={action.href} className="app-button-primary w-full justify-center">
          {action.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

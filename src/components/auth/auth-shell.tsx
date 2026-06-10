import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { PublicShell } from "@/components/layout/public-shell";

type AuthTab = {
  label: string;
  href: string;
  active?: boolean;
};

type AuthShellCard = {
  title: string;
  description: string;
  accent: "indigo" | "emerald" | "amber";
};

type AuthShellProps = {
  tabs: AuthTab[];
  formEyebrow: string;
  formTitle: string;
  formDescription: string;
  children: ReactNode;
  sideEyebrow: string;
  sideTitle: string;
  sideDescription: string;
  sideCards: AuthShellCard[];
  sideList?: string[];
  footerNote?: string;
  formFooter?: ReactNode;
  className?: string;
};

const CARD_ACCENTS: Record<AuthShellCard["accent"], string> = {
  indigo:
    "border-indigo-200/70 bg-white/10 text-indigo-50 shadow-[0_18px_40px_rgba(15,23,42,0.18)]",
  emerald:
    "border-emerald-200/25 bg-emerald-400/10 text-emerald-50 shadow-[0_18px_40px_rgba(16,185,129,0.12)]",
  amber:
    "border-amber-200/25 bg-amber-300/10 text-amber-50 shadow-[0_18px_40px_rgba(245,158,11,0.12)]",
};

const ICON_ACCENTS: Record<AuthShellCard["accent"], string> = {
  indigo: "bg-indigo-400/20 text-indigo-100",
  emerald: "bg-emerald-400/20 text-emerald-100",
  amber: "bg-amber-300/20 text-amber-50",
};

export function AuthShell({
  tabs,
  formEyebrow,
  formTitle,
  formDescription,
  children,
  sideEyebrow,
  sideTitle,
  sideDescription,
  sideCards,
  sideList,
  footerNote,
  formFooter,
  className,
}: AuthShellProps) {
  return (
    <PublicShell className="flex items-center">
      <div
        className={cn(
          "mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1320px] gap-6 lg:grid-cols-[1.04fr_0.96fr]",
          className,
        )}
      >
        <section className="app-fade-in-up order-2 overflow-hidden rounded-[2rem] border border-slate-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),_transparent_26%),radial-gradient(circle_at_85%_18%,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#0b1532_0%,_#111f3f_54%,_#0f172a_100%)] p-8 text-white shadow-[0_35px_90px_rgba(15,23,42,0.18)] sm:p-10 lg:order-1 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Resilience Platform
              </p>
              <p className="mt-1 text-sm text-slate-400">Parcours, preuves et supervision</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
              {sideEyebrow}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-[3.2rem] sm:leading-[1.05]">
              {sideTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {sideDescription}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {sideCards.map((card) => (
              <article
                key={card.title}
                className={cn(
                  "rounded-[1.6rem] border p-5 backdrop-blur-sm",
                  CARD_ACCENTS[card.accent],
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                    ICON_ACCENTS[card.accent],
                  )}
                >
                  <SparkTileIcon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200/85">{card.description}</p>
              </article>
            ))}
          </div>

          {sideList?.length ? (
            <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Ce que vous retrouvez dans la plateforme</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200/90">
                {sideList.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {footerNote ? <p className="mt-8 text-sm text-slate-400">{footerNote}</p> : null}
        </section>

        <section className="app-fade-in-up order-1 flex items-center lg:order-2">
          <div className="app-panel-strong relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/70 to-transparent" />

            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                <ArrowLeftIcon className="h-4 w-4" />
                Retour a l&apos;accueil
              </Link>
              <div className="hidden rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:inline-flex">
                Acces securise
              </div>
            </div>

            <nav className="mt-8 flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200/80 bg-slate-100/80 p-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.href + tab.label}
                  href={tab.href}
                  className={cn(
                    "rounded-[1.05rem] px-4 py-2.5 text-sm font-semibold transition",
                    tab.active
                      ? "bg-white text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
                  )}
                  aria-current={tab.active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            <header className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {formEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">
                {formTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {formDescription}
              </p>
            </header>

            <div className="mt-8">{children}</div>

            {formFooter ? <div className="mt-8 border-t border-slate-200/80 pt-6">{formFooter}</div> : null}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 5-3.3 8.5-7 10-3.7-1.5-7-5-7-10V6l7-3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkTileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

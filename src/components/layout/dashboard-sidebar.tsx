"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type UserRole } from "@prisma/client";
import { cn } from "@/lib/ui/cn";
import {
  getNavigationForRole,
  isNavigationItemActive,
  ROLE_LABELS,
} from "@/lib/navigation";

type DashboardSidebarProps = {
  role: UserRole;
  firstName: string;
  lastName: string;
};

function BrandMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-emerald-200">
        <path
          fill="currentColor"
          d="M11 3a1 1 0 0 1 2 0v2.1a6.5 6.5 0 0 1 5.9 5.9H21a1 1 0 1 1 0 2h-2.1a6.5 6.5 0 0 1-5.9 5.9V21a1 1 0 1 1-2 0v-2.1a6.5 6.5 0 0 1-5.9-5.9H3a1 1 0 1 1 0-2h2.1A6.5 6.5 0 0 1 11 5.1V3Zm1 4a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Zm-2 2.75a1 1 0 0 1 1.4 0L12 10.34l.6-.6a1 1 0 0 1 1.4 1.42l-.6.59l.6.6a1 1 0 1 1-1.4 1.4l-.6-.58l-.59.59a1 1 0 1 1-1.42-1.4l.6-.6l-.6-.59a1 1 0 0 1 0-1.42Z"
        />
      </svg>
    </span>
  );
}

function IconForLabel({ label, active }: { label: string; active: boolean }) {
  const color = active ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-200";
  const common = { viewBox: "0 0 24 24", "aria-hidden": true, className: `h-4.5 w-4.5 ${color}` };

  if (label === "Dashboard" || label === "Vue d'ensemble" || label === "Tableau de bord") {
    return (
      <svg {...common}>
        <path fill="currentColor" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4A1.5 1.5 0 0 1 18.5 11h-4A1.5 1.5 0 0 1 13 9.5v-4Zm-9 9A1.5 1.5 0 0 1 5.5 13h4A1.5 1.5 0 0 1 11 14.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4Zm9 0A1.5 1.5 0 0 1 14.5 13h4A1.5 1.5 0 0 1 20 14.5v4A1.5 1.5 0 0 1 18.5 20h-4A1.5 1.5 0 0 1 13 18.5v-4Z" />
      </svg>
    );
  }

  if (label === "Projets" || label === "Creer projet") {
    return (
      <svg {...common}>
        <path fill="currentColor" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h2a2.5 2.5 0 0 1 2.45 2h4.55A2.5 2.5 0 0 1 19 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-10Zm2.5-.5a.5.5 0 0 0-.5.5V8h10V6.5a.5.5 0 0 0-.5-.5H12v.75a1 1 0 1 1-2 0V6h-2.5Zm9.5 4H7v6.5c0 .28.22.5.5.5h9a.5.5 0 0 0 .5-.5V10Z" />
      </svg>
    );
  }

  if (label === "Étudiants" || label === "Profil") {
    return (
      <svg {...common}>
        <path fill="currentColor" d="M12 4a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7Zm-5 13a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1a1 1 0 1 1-2 0v-1a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1a1 1 0 1 1-2 0v-1Z" />
      </svg>
    );
  }

  if (label === "Progression" || label === "Feedback" || label === "Évaluations") {
    return (
      <svg {...common}>
        <path fill="currentColor" d="M5 17a1 1 0 0 1-1-1v-1.5a1 1 0 1 1 2 0V15h2.5a1 1 0 1 1 0 2H5Zm13-8a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-3.59l-4.24 4.24a1 1 0 0 1-1.42 0L8.5 13.82l-2.8 2.8a1 1 0 0 1-1.4-1.42l3.5-3.5a1 1 0 0 1 1.4 0l2.84 2.83L15.59 11H12a1 1 0 1 1 0-2h6Z" />
      </svg>
    );
  }

  if (label === "Portfolio") {
    return (
      <svg {...common}>
        <path fill="currentColor" d="M6.5 5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19h11a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 17.5 5h-11ZM6 9h12v7.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V9Zm7-4v2h-2V5h2Z" />
      </svg>
    );
  }

  return <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-300" : "bg-slate-400 group-hover:bg-slate-200"}`} />;
}

export function DashboardSidebar({
  role,
  firstName,
  lastName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const items = getNavigationForRole(role);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <aside className="border-b border-slate-200/70 bg-transparent lg:sticky lg:top-0 lg:h-screen lg:w-[262px] lg:self-start lg:overflow-hidden lg:border-b-0">
      <div className="flex h-full flex-col lg:pr-0">
        <div className="m-3 flex flex-col rounded-[2rem] border border-slate-900/70 bg-[linear-gradient(180deg,_#0a2137_0%,_#0c192d_100%)] px-4 py-4 text-white shadow-[0_28px_70px_rgba(8,27,49,0.24)] sm:m-4 sm:px-5 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="flex items-center gap-3 px-1">
            <BrandMark />
            <div>
              <p className="text-[1.05rem] font-semibold tracking-tight text-white">
                Resilience
              </p>
              <p className="text-xs text-slate-300/85">
                {role === "ADMIN"
                  ? "Console admin"
                  : role === "STUDENT"
                    ? "Espace étudiant"
                    : role === "SUPERVISOR"
                      ? "Espace superviseur"
                      : "Espace partenaire"}
              </p>
            </div>
          </div>

          <div className="mt-6 px-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400/90">
              {role === "ADMIN"
                ? "Pilotage"
                : role === "STUDENT"
                  ? "Espace étudiant"
                  : role === "SUPERVISOR"
                    ? "Supervision"
                    : ROLE_LABELS[role]}
            </p>
          </div>

          <nav className="mt-4 grid gap-1.5">
            {items.map((item) => {
              const active = isNavigationItemActive(pathname, item);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "group rounded-[1.15rem] border px-3.5 py-3 text-sm font-medium transition",
                    active
                      ? "border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "border-transparent bg-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <IconForLabel label={item.label} active={active} />
                      <span>{item.label}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition",
                        active ? "bg-emerald-300" : "bg-slate-600 group-hover:bg-slate-400",
                      )}
                    />
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {role === "STUDENT" ? "Profil validé" : "Mode supervision"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {role === "STUDENT"
                      ? "Votre profil est validé par l’équipe pédagogique."
                      : "Vous agissez sur les données clés du programme."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-200/90 text-sm font-semibold text-slate-900">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {firstName} {lastName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <span className="text-slate-500">{"->"}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

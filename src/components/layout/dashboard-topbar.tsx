"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { type UserRole } from "@prisma/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getPageTitleFromPath, ROLE_LABELS } from "@/lib/navigation";
import { cn } from "@/lib/ui/cn";

type DashboardTopbarProps = {
  role: UserRole;
  unreadNotificationCount: number;
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 text-slate-500">
      <path
        fill="currentColor"
        d="M12 4a4 4 0 0 1 4 4v1.26c0 .8.24 1.58.68 2.24l1.04 1.56c.66 1 .05 2.34-1.15 2.34H7.43c-1.2 0-1.8-1.34-1.15-2.34l1.04-1.56c.44-.66.68-1.44.68-2.24V8a4 4 0 0 1 4-4Zm0 16a2.75 2.75 0 0 0 2.58-1.8h-5.16A2.75 2.75 0 0 0 12 20Z"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 text-slate-500">
      <path
        fill="currentColor"
        d="m10.55 4.05l.22 1.55c.4-.1.81-.15 1.23-.15s.83.05 1.23.15l.22-1.55a1 1 0 0 1 1.3-.8l1.2.4a1 1 0 0 1 .66 1.2l-.37 1.52c.68.4 1.28.93 1.77 1.56l1.46-.56a1 1 0 0 1 1.27.66l.45 1.23a1 1 0 0 1-.62 1.28l-1.46.53c.06.35.09.7.09 1.06c0 .37-.03.73-.1 1.09l1.47.53a1 1 0 0 1 .62 1.28l-.45 1.23a1 1 0 0 1-1.27.66l-1.47-.56a7.06 7.06 0 0 1-1.76 1.56l.37 1.52a1 1 0 0 1-.65 1.2l-1.2.4a1 1 0 0 1-1.3-.8l-.22-1.55a5.7 5.7 0 0 1-2.46 0l-.22 1.55a1 1 0 0 1-1.3.8l-1.2-.4a1 1 0 0 1-.66-1.2l.37-1.52a7.06 7.06 0 0 1-1.77-1.56l-1.46.56a1 1 0 0 1-1.27-.66l-.45-1.23a1 1 0 0 1 .62-1.28l1.46-.53A5.9 5.9 0 0 1 5 12c0-.36.03-.71.1-1.06l-1.47-.53a1 1 0 0 1-.62-1.28l.45-1.23a1 1 0 0 1 1.27-.66l1.46.56c.49-.63 1.09-1.16 1.77-1.56l-.37-1.52a1 1 0 0 1 .66-1.2l1.2-.4a1 1 0 0 1 1.3.8ZM12 9.2a2.8 2.8 0 1 0 0 5.6a2.8 2.8 0 0 0 0-5.6Z"
      />
    </svg>
  );
}

export function DashboardTopbar({ role, unreadNotificationCount }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [isCondensed, setIsCondensed] = useState(false);
  const pageTitle = getPageTitleFromPath(pathname);
  const avatarInitials =
    role === "STUDENT" ? "IO" : role === "ADMIN" ? "ML" : role === "SUPERVISOR" ? "SP" : "CO";

  useEffect(() => {
    const handleScroll = () => {
      const shouldCondense = window.scrollY > 24;
      setIsCondensed((current) => (current === shouldCondense ? current : shouldCondense));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-slate-50/85 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div
        className={cn(
          "px-4 transition-[padding] duration-200 sm:px-6 lg:px-8",
          isCondensed ? "py-2.5" : "py-3.5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                Workspace
              </span>
              <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                {pageTitle}
              </p>
            </div>
            <p
              className={cn(
                "mt-1 truncate text-xs text-slate-500 transition-all duration-200",
                isCondensed ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
              )}
            >
              {ROLE_LABELS[role]}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/92 shadow-sm transition hover:border-slate-300"
            >
              <BellIcon />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label="Paramètres"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/92 shadow-sm transition hover:border-slate-300"
            >
              <GearIcon />
            </button>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-slate-800 sm:flex">
              {avatarInitials}
            </div>
            <div className="w-auto min-w-[122px]">
              <LogoutButton />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-[max-height,margin,opacity] duration-200 lg:hidden",
            isCondensed ? "mt-0 max-h-0 opacity-0" : "mt-3 max-h-24 opacity-100",
          )}
        >
          <MobileNav role={role} />
        </div>
      </div>
    </header>
  );
}

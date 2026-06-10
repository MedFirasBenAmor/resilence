"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type UserRole } from "@prisma/client";
import { getNavigationForRole, isNavigationItemActive } from "@/lib/navigation";
import { cn } from "@/lib/ui/cn";

type MobileNavProps = {
  role: UserRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = getNavigationForRole(role);

  return (
    <nav
      aria-label="Navigation mobile"
      className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
    >
      {items.map((item) => {
        const active = isNavigationItemActive(pathname, item);

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
              active
                ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                : "border-slate-200 bg-white/88 text-slate-700",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

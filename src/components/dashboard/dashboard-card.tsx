import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type DashboardCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children?: ReactNode;
};

export function DashboardCard({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  children,
}: DashboardCardProps) {
  return (
    <section className="app-panel app-hover-card app-fade-in-up p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="app-eyebrow">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
          ) : null}
        </div>
        {href && hrefLabel ? (
          <Link
            href={href}
            className={cn("app-button-secondary text-sm")}
          >
            {hrefLabel}
          </Link>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

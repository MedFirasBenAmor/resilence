import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn("py-0", className)}>
      <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          {eyebrow ? <p className="app-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl xl:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-7">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3 pt-1 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}

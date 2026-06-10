import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn("rounded-[1.75rem] border border-slate-200/80 bg-slate-50/70 p-5", className)}>
      <div className="max-w-3xl">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

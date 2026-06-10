import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type DataCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DataCard({
  title,
  description,
  children,
  className,
}: DataCardProps) {
  return (
    <section className={cn("app-panel app-hover-card p-6", className)}>
      {title ? <h2 className="app-section-title">{title}</h2> : null}
      {description ? (
        <p className={cn(title ? "mt-2" : "", "app-body-muted text-sm")}>{description}</p>
      ) : null}
      <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type DashboardShellProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <main className={cn("mx-auto max-w-[1380px] px-4 py-6 sm:px-6 sm:py-7 xl:px-8", className)}>
      {children}
    </main>
  );
}

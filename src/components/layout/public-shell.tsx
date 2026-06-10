import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type PublicShellProps = {
  children: ReactNode;
  className?: string;
};

export function PublicShell({ children, className }: PublicShellProps) {
  return (
    <main className={cn("app-shell-bg min-h-screen px-4 py-6 sm:px-6 sm:py-8", className)}>
      <div className="mx-auto max-w-[1800px]">{children}</div>
    </main>
  );
}

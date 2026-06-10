import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

export function FormActions({ children, className }: FormActionsProps) {
  return <div className={cn("flex flex-wrap items-center gap-3 pt-2", className)}>{children}</div>;
}

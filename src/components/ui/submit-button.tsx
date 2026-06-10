"use client";

import { cn } from "@/lib/ui/cn";

type SubmitButtonProps = {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  className?: string;
};

export function SubmitButton({
  pending,
  idleLabel,
  pendingLabel,
  className,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "app-button-primary disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

import React from "react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type ButtonVariant = "primary" | "secondary" | "danger";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "app-button-primary",
  secondary: "app-button-secondary",
  danger: "app-button-danger",
};

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        VARIANT_STYLES[variant],
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = BaseProps & {
  href: string;
};

export function LinkButton({
  children,
  className,
  href,
  variant = "primary",
}: LinkButtonProps) {
  return (
    <Link href={href} className={cn(VARIANT_STYLES[variant], className)}>
      {children}
    </Link>
  );
}

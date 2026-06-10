"use client";

import type { ReactNode } from "react";

type FormFieldProps = {
  htmlFor?: string;
  label: string;
  helperText?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

export function FormField({
  htmlFor,
  label,
  helperText,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <label
        className="block text-sm font-medium tracking-tight text-slate-800"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : helperText ? (
        <p className="text-sm leading-6 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

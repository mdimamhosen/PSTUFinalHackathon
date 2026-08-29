import * as React from "react";
import { cn } from "../lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[hsl(var(--destructive))]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>
      ) : null}
    </div>
  );
}

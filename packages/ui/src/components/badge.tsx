import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]",
  secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/70",
  destructive: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70",
  outline: "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-transparent",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

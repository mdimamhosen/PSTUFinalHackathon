import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const styles: Record<Variant, string> = {
  info: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--primary))]/15",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  warning: "bg-amber-50 text-amber-950 border-amber-200",
  error: "bg-red-50 text-red-900 border-red-200",
};

export function Alert({
  title,
  children,
  variant = "info",
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3 text-sm animate-fade", styles[variant], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1 opacity-90")}>{children}</div> : null}
    </div>
  );
}

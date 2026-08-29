const fs = require("fs");
const path = require("path");

function write(rel, content) {
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("wrote", rel);
}

write(
  "packages/ui/src/globals.css",
  `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 160 30% 97%;
  --foreground: 168 40% 10%;
  --card: 0 0% 100%;
  --card-foreground: 168 40% 10%;
  --primary: 173 72% 28%;
  --primary-foreground: 0 0% 100%;
  --secondary: 165 25% 93%;
  --secondary-foreground: 168 35% 18%;
  --muted: 160 18% 94%;
  --muted-foreground: 168 10% 42%;
  --accent: 168 55% 92%;
  --accent-foreground: 173 72% 22%;
  --success: 152 60% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 45%;
  --warning-foreground: 0 0% 100%;
  --destructive: 0 72% 48%;
  --destructive-foreground: 0 0% 100%;
  --border: 165 18% 88%;
  --input: 165 18% 88%;
  --ring: 173 72% 28%;
  --radius: 0.875rem;
  --surface-glow: 165 45% 92%;
}

.theme-admin {
  --background: 210 20% 97%;
  --foreground: 215 28% 14%;
  --primary: 215 28% 17%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 16% 93%;
  --secondary-foreground: 215 28% 17%;
  --muted: 210 16% 94%;
  --muted-foreground: 215 12% 42%;
  --accent: 210 25% 92%;
  --accent-foreground: 215 28% 17%;
  --border: 214 18% 88%;
  --input: 214 18% 88%;
  --ring: 215 28% 17%;
}

@layer base {
  * {
    @apply border-[hsl(var(--border))];
  }
  html {
    @apply antialiased;
  }
  body {
    @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--surface-glow)), transparent),
      linear-gradient(180deg, hsl(160 30% 98%), hsl(var(--background)));
    background-attachment: fixed;
    font-feature-settings: "ss01" on, "cv11" on;
  }
  :focus-visible {
    @apply outline-none ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))];
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  .tabular {
    font-variant-numeric: tabular-nums;
  }
  .animate-in {
    animation: fade-up 0.35s ease-out both;
  }
  .animate-fade {
    animation: fade 0.25s ease-out both;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
`,
);

write(
  "packages/ui/src/components/spinner.tsx",
  `import { cn } from "../lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-r-transparent animate-[spin_0.7s_linear_infinite]",
        className,
      )}
    />
  );
}
`,
);

write(
  "packages/ui/src/components/button.tsx",
  `"use client";
import * as React from "react";
import { cn } from "../lib/utils";
import { Spinner } from "./spinner";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "success";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:brightness-110 active:brightness-95",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]",
  outline:
    "border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm hover:bg-[hsl(var(--muted))]",
  ghost: "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
  destructive:
    "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:brightness-110",
  success: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:brightness-110",
};

const sizes: Record<Size, string> = {
  default: "h-11 px-4 text-sm",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  icon: "size-11",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="opacity-90" /> : null}
      {children}
    </button>
  );
}
`,
);

write(
  "packages/ui/src/components/input.tsx",
  `"use client";
import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-xl border bg-[hsl(var(--card))] px-3.5 py-2 text-sm shadow-sm transition",
        "placeholder:text-[hsl(var(--muted-foreground))]",
        "hover:border-[hsl(var(--muted-foreground))]/30",
        "focus-visible:border-[hsl(var(--ring))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
`,
);

write(
  "packages/ui/src/components/field.tsx",
  `import * as React from "react";
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
`,
);

write(
  "packages/ui/src/components/card.tsx",
  `import * as React from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]/90 text-[hsl(var(--card-foreground))] shadow-sm backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-5 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold tracking-tight leading-none", className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-2", className)} {...props} />;
}
`,
);

write(
  "packages/ui/src/components/badge.tsx",
  `import * as React from "react";
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
`,
);

write(
  "packages/ui/src/components/skeleton.tsx",
  `import { cn } from "../lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[hsl(var(--muted))] via-[hsl(var(--secondary))] to-[hsl(var(--muted))] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
`,
);

write(
  "packages/ui/src/components/alert.tsx",
  `import * as React from "react";
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
`,
);

write(
  "packages/ui/src/components/empty-state.tsx",
  `import * as React from "react";
import { cn } from "../lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 px-6 py-12 text-center animate-in",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
        {icon ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h10M4 17h7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))] text-balance">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/page-header.tsx",
  `import * as React from "react";
import { cn } from "../lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-3 animate-in", className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-balance">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
`,
);

console.log("batch 1 done");

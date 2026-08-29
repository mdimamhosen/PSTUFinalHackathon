const fs = require("fs");
const path = require("path");

function write(rel, content) {
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("wrote", rel);
}

write(
  "packages/ui/src/components/toast.tsx",
  `"use client";
import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "default" | "error" | "success";
type ToastItem = { id: string; message: string; variant: Variant };

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  push: (message: string, variant?: Variant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, variant: Variant = "default") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-in",
              t.variant === "error" && "bg-red-600 text-white",
              t.variant === "success" && "bg-emerald-700 text-white",
              t.variant === "default" && "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
`,
);

write(
  "packages/ui/src/components/layout-shell.tsx",
  `"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match?: string;
};

export function LayoutShell({
  brand,
  nav,
  children,
  actions,
}: {
  brand: React.ReactNode;
  nav: NavItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">{brand}</div>
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-5 pb-28">{children}</main>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]/95 backdrop-blur-md safe-pb"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.match ? pathname.startsWith(item.match) : pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-medium transition",
                  active
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl transition",
                    active && "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]",
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 12h12M12 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight">Relay</p>
        {subtitle ? (
          <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/admin-shell.tsx",
  `"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { BrandMark } from "./layout-shell";

export function AdminShell({
  nav,
  children,
  actions,
}: {
  nav: Array<{ href: string; label: string }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="theme-admin min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-[hsl(var(--card))]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-6">
            <BrandMark subtitle="Admin" />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Admin">
              {nav.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          {actions}
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t px-3 py-2 md:hidden"
          aria-label="Admin mobile"
        >
          {nav.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "bg-[hsl(var(--secondary))]"
                    : "text-[hsl(var(--muted-foreground))]",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/data-table.tsx",
  `import * as React from "react";
import { cn } from "../lib/utils";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export function DataTable({
  headers,
  loading,
  emptyTitle = "No results",
  emptyDescription,
  children,
  className,
}: {
  headers: string[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const rows = React.Children.toArray(children);
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-[hsl(var(--card))]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-[hsl(var(--muted))]/60 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]/80">{children}</tbody>
        </table>
      </div>
      {loading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}
      {!loading && rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : null}
    </div>
  );
}
`,
);

write(
  "packages/ui/src/index.ts",
  `export * from "./components/button";
export * from "./components/input";
export * from "./components/field";
export * from "./components/card";
export * from "./components/badge";
export * from "./components/skeleton";
export * from "./components/spinner";
export * from "./components/toast";
export * from "./components/alert";
export * from "./components/empty-state";
export * from "./components/page-header";
export * from "./components/layout-shell";
export * from "./components/admin-shell";
export * from "./components/data-table";
export * from "./lib/money";
export * from "./lib/errors";
export * from "./lib/utils";
`,
);

const tailwindExtend = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      boxShadow: {
        soft: "0 10px 40px -18px rgba(15, 118, 110, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
`;

write("apps/user/tailwind.config.ts", tailwindExtend);
write("apps/admin/tailwind.config.ts", tailwindExtend);

console.log("batch 2 done");

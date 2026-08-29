"use client";
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

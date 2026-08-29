'use client';
import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";

export type NavItem = { href: string; label: string; icon?: string };

export function LayoutShell({
  title,
  nav,
  children,
  actions,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[hsl(var(--primary))]">{title}</h1>
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-white">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
              )}
            >
              <span className="text-base">{item.icon ?? "•"}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

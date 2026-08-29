"use client";
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

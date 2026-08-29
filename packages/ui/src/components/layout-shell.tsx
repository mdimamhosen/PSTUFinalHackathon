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

function isActive(pathname: string, item: NavItem) {
  return (
    pathname === item.href ||
    (item.match ? pathname.startsWith(item.match) : pathname.startsWith(item.href))
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

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
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navList = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Primary">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--card))] shadow-sm">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/90 backdrop-blur-md lg:flex">
        <div className="flex h-14 items-center border-b border-[hsl(var(--border))]/70 px-4">
          {brand}
        </div>
        {navList}
        {actions ? (
          <div className="mt-auto space-y-2 border-t border-[hsl(var(--border))]/70 p-3">
            {actions}
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/90 px-4 backdrop-blur-md lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon open={open} />
            </button>
            <div className="min-w-0 truncate">{brand}</div>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 animate-fade"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-[hsl(var(--card))] shadow-xl animate-in">
              <div className="flex h-14 items-center justify-between border-b px-4">
                {brand}
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-[hsl(var(--muted))]"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <MenuIcon open />
                </button>
              </div>
              {navList}
              {actions ? (
                <div className="mt-auto space-y-2 border-t p-3">{actions}</div>
              ) : null}
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
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

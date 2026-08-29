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
  nav: Array<{ href: string; label: string; icon?: React.ReactNode }>;
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
    <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Admin">
      {nav.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
            )}
            aria-current={active ? "page" : undefined}
          >
            {l.icon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--card))] shadow-sm">
                {l.icon}
              </span>
            ) : null}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="theme-admin min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-[hsl(var(--card))]/95 backdrop-blur-md lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <BrandMark subtitle="Admin" />
        </div>
        {navList}
        {actions ? (
          <div className="mt-auto border-t p-3">{actions}</div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-[hsl(var(--card))]/95 px-4 backdrop-blur-md lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-[hsl(var(--muted))]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
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
            </button>
            <BrandMark subtitle="Admin" />
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
              <div className="flex h-14 items-center border-b px-4">
                <BrandMark subtitle="Admin" />
              </div>
              {navList}
              {actions ? <div className="mt-auto border-t p-3">{actions}</div> : null}
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

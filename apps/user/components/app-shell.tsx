"use client";
import Link from "next/link";
import { BrandMark, Button, LayoutShell } from "@relay/ui";
import { logoutAction } from "@/lib/actions";
import { IconBell, IconHome, IconMore, IconReceive, IconRequest, IconSend } from "./icons";

const nav = [
  { href: "/dashboard", label: "Home", icon: <IconHome />, match: "/dashboard" },
  { href: "/send", label: "Send", icon: <IconSend />, match: "/send" },
  { href: "/request", label: "Request", icon: <IconRequest />, match: "/request" },
  { href: "/receive", label: "Receive", icon: <IconReceive />, match: "/receive" },
  { href: "/activity", label: "More", icon: <IconMore />, match: "/activity" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell
      brand={<BrandMark />}
      nav={nav}
      actions={
        <>
          <Link
            href="/notifications"
            className="inline-flex size-10 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            aria-label="Notifications"
          >
            <IconBell />
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </>
      }
    >
      {children}
    </LayoutShell>
  );
}

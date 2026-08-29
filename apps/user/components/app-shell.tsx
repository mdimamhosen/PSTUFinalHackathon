'use client';
import Link from "next/link";
import { LayoutShell } from "@relay/ui";
import { logoutAction } from "@/lib/actions";
import { Button } from "@relay/ui";

const nav = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/send", label: "Send", icon: "↗" },
  { href: "/request", label: "Request", icon: "↙" },
  { href: "/receive", label: "Receive", icon: "📥" },
  { href: "/activity", label: "More", icon: "⋯" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell
      title="Relay"
      nav={nav}
      actions={
        <div className="flex gap-2">
          <Link href="/notifications" className="text-sm">🔔</Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">Out</Button>
          </form>
        </div>
      }
    >
      {children}
    </LayoutShell>
  );
}

"use client";
import { BrandMark, Button, LayoutShell } from "@relay/ui";
import { logoutAction } from "@/lib/actions";
import {
  IconActivity,
  IconBell,
  IconContacts,
  IconHome,
  IconReceive,
  IconRequest,
  IconRewards,
  IconSend,
  IconSplit,
} from "./icons";

const nav = [
  { href: "/dashboard", label: "Home", icon: <IconHome />, match: "/dashboard" },
  { href: "/send", label: "Send", icon: <IconSend />, match: "/send" },
  { href: "/request", label: "Request", icon: <IconRequest />, match: "/request" },
  { href: "/receive", label: "Receive", icon: <IconReceive />, match: "/receive" },
  { href: "/split", label: "Split", icon: <IconSplit />, match: "/split" },
  { href: "/activity", label: "Activity", icon: <IconActivity />, match: "/activity" },
  { href: "/contacts", label: "Contacts", icon: <IconContacts />, match: "/contacts" },
  { href: "/rewards", label: "Rewards", icon: <IconRewards />, match: "/rewards" },
  { href: "/notifications", label: "Alerts", icon: <IconBell />, match: "/notifications" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell
      brand={<BrandMark />}
      nav={nav}
      actions={
        <form action={logoutAction} className="w-full">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      }
    >
      {children}
    </LayoutShell>
  );
}

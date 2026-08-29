import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  if (!token) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

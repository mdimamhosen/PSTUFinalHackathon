import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { Button } from "@relay/ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  if (!token) redirect("/login");
  const links = [
    { href: "/users", label: "Users" },
    { href: "/transactions", label: "Transactions" },
    { href: "/audit", label: "Audit" },
    { href: "/reconciliation", label: "Reconcile" },
    { href: "/abuse", label: "Abuse" },
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-bold">Relay Admin</span>
            <nav className="flex gap-3 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-slate-600 hover:text-slate-900">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}

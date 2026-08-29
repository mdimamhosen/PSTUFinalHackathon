import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import { logoutAction } from "@/lib/actions";
import { AdminShell, Button } from "@relay/ui";

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
    <AdminShell
      nav={links}
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}

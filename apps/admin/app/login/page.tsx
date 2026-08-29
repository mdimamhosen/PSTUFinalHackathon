import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="theme-admin mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark subtitle="Operations" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin console</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Users, reconciliation, and abuse review — no wallet send
          </p>
        </div>
      </div>
      <AuthForm
        title="Sign in"
        description="ADMIN role required"
        action={loginAction}
        submitLabel="Continue"
        fields={[
          { name: "emailOrUsername", label: "Email", placeholder: "admin@relay.local" },
          { name: "password", label: "Password", type: "password" },
        ]}
      />
    </div>
  );
}

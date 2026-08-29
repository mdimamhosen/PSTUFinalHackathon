import Link from "next/link";
import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Open your wallet</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Instant opening balance of ৳100,000 — closed-loop BDT
          </p>
        </div>
      </div>
      <AuthForm
        title="Create account"
        description="We'll verify email, then phone"
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name", autoComplete: "name" },
          { name: "username", label: "Username", placeholder: "johndoe", autoComplete: "username" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "phone", label: "Phone", placeholder: "01XXXXXXXXX", autoComplete: "tel" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Have an account?{" "}
            <Link href="/login" className="font-semibold text-[hsl(var(--primary))] hover:underline">
              Sign in
            </Link>
          </p>
        }
      />
    </div>
  );
}

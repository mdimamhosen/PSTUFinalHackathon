import Link from "next/link";
import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Sign in to move money instantly with Relay
          </p>
        </div>
      </div>
      <AuthForm
        title="Sign in"
        description="Use your email or username"
        action={loginAction}
        submitLabel="Continue"
        fields={[
          {
            name: "emailOrUsername",
            label: "Email or username",
            placeholder: "you@example.com",
            autoComplete: "username",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
            New here?{" "}
            <Link href="/register" className="font-semibold text-[hsl(var(--primary))] hover:underline">
              Create account
            </Link>
          </p>
        }
      />
    </div>
  );
}

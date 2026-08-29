import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">Relay</h1>
        <p className="text-sm text-slate-500">Sign in to your wallet</p>
      </div>
      <AuthForm
        action={loginAction}
        submitLabel="Sign in"
        fields={[
          { name: "emailOrUsername", label: "Email or username", placeholder: "you@example.com" },
          { name: "password", label: "Password", type: "password" },
        ]}
        footer={
          <p className="mt-4 text-center text-sm text-slate-500">
            New here?{" "}
            <Link href="/register" className="text-blue-600">
              Create account
            </Link>
          </p>
        }
      />
    </div>
  );
}

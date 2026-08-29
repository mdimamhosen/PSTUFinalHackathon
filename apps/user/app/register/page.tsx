import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">Relay</h1>
        <p className="text-sm text-slate-500">Create your wallet — ৳100,000 opening balance</p>
      </div>
      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name" },
          { name: "username", label: "Username", placeholder: "johndoe" },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", placeholder: "01XXXXXXXXX" },
          { name: "password", label: "Password", type: "password" },
        ]}
        footer={
          <p className="mt-4 text-center text-sm text-slate-500">
            Have an account?{" "}
            <Link href="/login" className="text-blue-600">
              Sign in
            </Link>
          </p>
        }
      />
    </div>
  );
}

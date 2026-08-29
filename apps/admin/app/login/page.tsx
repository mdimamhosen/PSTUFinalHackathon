import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Relay Admin</h1>
        <p className="text-sm text-slate-500">Operations console</p>
      </div>
      <AuthForm
        action={loginAction}
        submitLabel="Admin sign in"
        fields={[
          { name: "emailOrUsername", label: "Email", placeholder: "admin@relay.local" },
          { name: "password", label: "Password", type: "password" },
        ]}
      />
    </div>
  );
}

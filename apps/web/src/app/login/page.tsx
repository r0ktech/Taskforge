import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/home");
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where your team left off.">
      <LoginForm />
    </AuthShell>
  );
}

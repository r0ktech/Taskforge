import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/home");
  return (
    <AuthShell title="Create your workspace" subtitle="Set up your organization in under a minute.">
      <SignupForm />
    </AuthShell>
  );
}

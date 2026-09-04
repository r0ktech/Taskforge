import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserOrgsWithWorkspaces } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const orgs = await getUserOrgsWithWorkspaces(user.id);

  return <AppShell orgs={orgs}>{children}</AppShell>;
}

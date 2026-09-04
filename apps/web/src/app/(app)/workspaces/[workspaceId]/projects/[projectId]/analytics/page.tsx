import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getProjectRole } from "@/lib/permissions";
import { getProjectAnalytics } from "@/lib/analytics";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

export default async function AnalyticsPage({ params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const role = await getProjectRole(user.id, params.projectId);
  if (!role) notFound();

  const [data, memberCount] = await Promise.all([
    getProjectAnalytics(params.projectId),
    prisma.projectMember.count({ where: { projectId: params.projectId } }),
  ]);

  return <AnalyticsClient data={data} teamSize={memberCount} />;
}

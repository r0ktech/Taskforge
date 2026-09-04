import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getOrgRole, can } from "@/lib/permissions";
import { AuditLogClient } from "@/components/workspace/AuditLogClient";

export default async function AuditLogPage({ params }: { params: { orgSlug: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } });
  if (!org) notFound();

  const role = await getOrgRole(user.id, org.id);
  if (!role || !can(role, "auditLog.view")) notFound();

  const [logs, members] = await Promise.all([
    prisma.auditLog.findMany({
      where: { orgId: org.id },
      include: { actor: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { createdAt: "desc" },
      take: 31,
    }),
    prisma.organizationMember.findMany({ where: { orgId: org.id }, include: { user: { select: { id: true, name: true } } } }),
  ]);

  const hasMore = logs.length > 30;
  const page = hasMore ? logs.slice(0, 30) : logs;

  return (
    <AuditLogClient
      orgId={org.id}
      initialLogs={page.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
      initialCursor={hasMore ? page[page.length - 1].id : null}
      members={members.map((m) => m.user)}
    />
  );
}

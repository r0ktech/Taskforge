import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getOrgRole, can } from "@/lib/permissions";
import { MembersClient } from "@/components/workspace/MembersClient";

export default async function MembersPage({ params }: { params: { orgSlug: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } });
  if (!org) notFound();

  const role = await getOrgRole(user.id, org.id);
  if (!role) notFound();

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId: org.id },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true, avatarUrl: true, title: true } } },
      orderBy: { createdAt: "asc" },
    }),
    can(role, "invitation.send")
      ? prisma.invitation.findMany({
          where: { orgId: org.id, status: "PENDING" },
          include: { invitedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <MembersClient
      orgId={org.id}
      myRole={role}
      initialMembers={members.map((m) => ({ ...m.user, role: m.role }))}
      initialInvitations={invitations.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
    />
  );
}

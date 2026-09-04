import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getWorkspaceRole } from "@/lib/permissions";
import { WorkspaceOverviewClient } from "@/components/workspace/WorkspaceOverviewClient";

export default async function WorkspacePage({ params }: { params: { workspaceId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const role = await getWorkspaceRole(user.id, params.workspaceId);
  if (!role) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    include: {
      teams: { orderBy: { createdAt: "asc" }, include: { _count: { select: { members: true, projects: true } } } },
      projects: {
        where: { archivedAt: null },
        orderBy: { createdAt: "asc" },
        include: { team: { select: { id: true, name: true, color: true } }, _count: { select: { tasks: true, members: true } } },
      },
      members: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
    },
  });
  if (!workspace) notFound();

  return (
    <WorkspaceOverviewClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      myRole={role}
      teams={workspace.teams}
      projects={workspace.projects}
      members={workspace.members}
    />
  );
}

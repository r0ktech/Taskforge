import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getProjectRole } from "@/lib/permissions";
import { BoardClient } from "@/components/board/BoardClient";

export default async function BoardPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const role = await getProjectRole(user.id, params.projectId);
  if (!role) notFound();

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      labels: true,
      members: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
      boards: {
        include: {
          columns: {
            orderBy: { order: "asc" },
            include: {
              tasks: {
                where: { archivedAt: null },
                orderBy: { order: "asc" },
                include: {
                  assignees: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
                  labels: { include: { label: true } },
                  _count: { select: { comments: true, attachments: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!project) notFound();

  return (
    <BoardClient
      project={JSON.parse(JSON.stringify(project))}
      myRole={role}
      currentUserId={user.id}
      workspaceId={params.workspaceId}
    />
  );
}

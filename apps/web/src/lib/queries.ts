import { prisma } from "./db";

export async function getMyWorkOverview(userId: string) {
  const assignments = await prisma.taskAssignee.findMany({
    where: { userId, task: { archivedAt: null } },
    include: {
      task: {
        include: {
          project: { select: { id: true, key: true, name: true, workspaceId: true } },
          column: { select: { name: true, isDoneColumn: true } },
        },
      },
    },
  });

  const openTasks = assignments
    .map((a) => a.task)
    .filter((t) => !t.column.isDoneColumn)
    .sort((a, b) => {
      const ad = a.dueDate?.getTime() ?? Infinity;
      const bd = b.dueDate?.getTime() ?? Infinity;
      return ad - bd;
    });

  const orgMemberships = await prisma.organizationMember.findMany({ where: { userId }, select: { orgId: true } });
  const orgIds = orgMemberships.map((m) => m.orgId);

  const recentActivity = await prisma.auditLog.findMany({
    where: { orgId: { in: orgIds } },
    include: { actor: { select: { name: true, avatarColor: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return { openTasks, recentActivity };
}

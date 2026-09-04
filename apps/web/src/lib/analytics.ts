import { prisma } from "./db";
import { subDays, startOfDay, format } from "date-fns";

export async function getProjectAnalytics(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { boards: { include: { columns: { orderBy: { order: "asc" } } } } },
  });
  const board = project.boards[0];

  const [tasksByColumn, tasksByPriority, allTasks] = await Promise.all([
    prisma.task.groupBy({
      by: ["columnId"],
      where: { projectId, archivedAt: null },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { projectId, archivedAt: null },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        columnId: true,
        dueDate: true,
        archivedAt: true,
        updatedAt: true,
        createdAt: true,
        assignees: { select: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    }),
  ]);

  const doneColumnIds = new Set(board?.columns.filter((c) => c.isDoneColumn).map((c) => c.id) ?? []);

  const byColumn = (board?.columns ?? []).map((c) => ({
    columnId: c.id,
    name: c.name,
    color: c.color,
    count: tasksByColumn.find((t) => t.columnId === c.id)?._count._all ?? 0,
  }));

  const byPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => ({
    priority: p,
    count: tasksByPriority.find((t) => t.priority === p)?._count._all ?? 0,
  }));

  const days = Array.from({ length: 14 }).map((_, i) => startOfDay(subDays(new Date(), 13 - i)));
  const throughput = days.map((day) => {
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const count = allTasks.filter((t) => doneColumnIds.has(t.columnId) && t.updatedAt >= day && t.updatedAt < next).length;
    return { date: format(day, "MMM d"), completed: count };
  });

  const now = new Date();
  const overdue = allTasks.filter((t) => t.dueDate && t.dueDate < now && !doneColumnIds.has(t.columnId) && !t.archivedAt).length;

  const workloadMap = new Map<string, { userId: string; name: string; color: string; count: number }>();
  for (const t of allTasks) {
    if (t.archivedAt || doneColumnIds.has(t.columnId)) continue;
    for (const a of t.assignees) {
      const entry = workloadMap.get(a.user.id) ?? { userId: a.user.id, name: a.user.name, color: a.user.avatarColor, count: 0 };
      entry.count += 1;
      workloadMap.set(a.user.id, entry);
    }
  }

  return {
    byColumn,
    byPriority,
    throughput,
    overdue,
    totalOpen: allTasks.filter((t) => !t.archivedAt && !doneColumnIds.has(t.columnId)).length,
    totalDone: allTasks.filter((t) => doneColumnIds.has(t.columnId)).length,
    workload: Array.from(workloadMap.values()).sort((a, b) => b.count - a.count),
  };
}

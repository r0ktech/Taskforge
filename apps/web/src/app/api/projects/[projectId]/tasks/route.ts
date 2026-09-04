import { NextRequest } from "next/server";
import { createTaskSchema, can, rooms } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { recordAudit, enqueueEmail } from "@/lib/queue";
import { orderAtEnd } from "@/lib/order";

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireUser();
    const role = await getProjectRole(user.id, params.projectId);
    if (!can(role, "task.create")) throw new ApiError(403, "Not authorized to create tasks");

    const body = createTaskSchema.parse(await req.json());

    const project = await prisma.project.findUniqueOrThrow({
      where: { id: params.projectId },
      include: { workspace: { select: { orgId: true } }, boards: true },
    });
    const board = project.boards[0];
    if (!board) throw new ApiError(404, "Board not found");

    const column = await prisma.boardColumn.findUniqueOrThrow({ where: { id: body.columnId } });
    const lastTask = await prisma.task.findFirst({
      where: { columnId: body.columnId },
      orderBy: { order: "desc" },
    });

    const { task, number } = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: params.projectId },
        data: { taskSeq: { increment: 1 } },
      });
      const number = updatedProject.taskSeq;

      const task = await tx.task.create({
        data: {
          number,
          projectId: params.projectId,
          boardId: board.id,
          columnId: body.columnId,
          title: body.title,
          description: body.description,
          priority: body.priority,
          order: orderAtEnd(lastTask?.order),
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          createdById: user.id,
          assignees: { create: body.assigneeIds.map((userId) => ({ userId })) },
          labels: { create: body.labelIds.map((labelId) => ({ labelId })) },
        },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
          labels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });
      return { task, number };
    });

    await publishEvent({
      type: "task.created",
      room: rooms.board(board.id),
      payload: { taskId: task.id, columnId: task.columnId, boardId: board.id },
    });

    await recordAudit({
      orgId: project.workspace.orgId,
      actorId: user.id,
      action: "task.created",
      entityType: "task",
      entityId: task.id,
      metadata: { title: task.title, ref: `${project.key}-${number}` },
    });

    // Notify anyone assigned at creation time (skip notifying yourself).
    for (const assignee of task.assignees) {
      if (assignee.userId === user.id) continue;
      await prisma.notification.create({
        data: {
          recipientId: assignee.userId,
          actorId: user.id,
          type: "ASSIGNED",
          title: `${user.name} assigned you a task`,
          body: `${project.key}-${number}: ${task.title}`,
          link: `/projects/${project.id}/board?task=${task.id}`,
        },
      });
      await publishEvent({
        type: "notification.created",
        room: rooms.user(assignee.userId),
        payload: { notificationId: task.id, recipientId: assignee.userId },
      });
      const assigneeUser = await prisma.user.findUnique({ where: { id: assignee.userId } });
      if (assigneeUser) {
        await enqueueEmail({
          name: "assigned",
          to: assigneeUser.email,
          data: {
            actorName: user.name,
            taskRef: `${project.key}-${number}`,
            taskTitle: task.title,
            link: `/projects/${project.id}/board?task=${task.id}`,
          },
        });
      }
    }

    return json({ task: { ...task, ref: `${project.key}-${number}` } }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

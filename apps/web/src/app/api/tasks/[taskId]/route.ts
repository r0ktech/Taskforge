import { NextRequest } from "next/server";
import { updateTaskSchema, can, rooms } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { recordAudit } from "@/lib/queue";

async function loadTaskWithProject(taskId: string) {
  return prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { project: { include: { workspace: { select: { orgId: true } } } } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await loadTaskWithProject(params.taskId);
    const role = await getProjectRole(user.id, task.projectId);
    if (!role) throw new ApiError(403, "Not authorized");

    const full = await prisma.task.findUniqueOrThrow({
      where: { id: params.taskId },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
        labels: { include: { label: true } },
        createdBy: { select: { id: true, name: true, avatarColor: true } },
        attachments: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } },
            attachments: true,
          },
        },
      },
    });

    return json({ task: { ...full, ref: `${task.project.key}-${task.number}` } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await loadTaskWithProject(params.taskId);
    const role = await getProjectRole(user.id, task.projectId);
    if (!can(role, "task.update")) throw new ApiError(403, "Not authorized to edit this task");

    const body = updateTaskSchema.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
      if (body.assigneeIds) {
        await tx.taskAssignee.deleteMany({ where: { taskId: params.taskId } });
        await tx.taskAssignee.createMany({
          data: body.assigneeIds.map((userId) => ({ taskId: params.taskId, userId })),
        });
      }
      if (body.labelIds) {
        await tx.taskLabel.deleteMany({ where: { taskId: params.taskId } });
        await tx.taskLabel.createMany({
          data: body.labelIds.map((labelId) => ({ taskId: params.taskId, labelId })),
        });
      }
      return tx.task.update({
        where: { id: params.taskId },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
        },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
          labels: { include: { label: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      });
    });

    await publishEvent({
      type: "task.updated",
      room: rooms.board(task.boardId),
      payload: { taskId: task.id, fields: body },
    });

    await recordAudit({
      orgId: task.project.workspace.orgId,
      actorId: user.id,
      action: "task.updated",
      entityType: "task",
      entityId: task.id,
      metadata: { fields: Object.keys(body) },
    });

    return json({ task: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await loadTaskWithProject(params.taskId);
    const role = await getProjectRole(user.id, task.projectId);
    if (!can(role, "task.delete")) throw new ApiError(403, "Not authorized to delete this task");

    await prisma.task.update({ where: { id: params.taskId }, data: { archivedAt: new Date() } });

    await publishEvent({
      type: "task.deleted",
      room: rooms.board(task.boardId),
      payload: { taskId: task.id, columnId: task.columnId },
    });

    await recordAudit({
      orgId: task.project.workspace.orgId,
      actorId: user.id,
      action: "task.deleted",
      entityType: "task",
      entityId: task.id,
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

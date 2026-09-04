import { NextRequest } from "next/server";
import { moveTaskSchema, can, rooms } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { recordAudit } from "@/lib/queue";

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: params.taskId },
      include: { project: { include: { workspace: { select: { orgId: true } } } } },
    });
    const role = await getProjectRole(user.id, task.projectId);
    if (!can(role, "task.move")) throw new ApiError(403, "Not authorized to move this task");

    const body = moveTaskSchema.parse(await req.json());
    const fromColumnId = task.columnId;

    const targetColumn = await prisma.boardColumn.findUnique({ where: { id: body.columnId } });
    if (!targetColumn || targetColumn.boardId !== task.boardId) {
      throw new ApiError(400, "Target column does not belong to this task's board");
    }

    if (targetColumn.wipLimit) {
      const count = await prisma.task.count({
        where: { columnId: body.columnId, archivedAt: null, id: { not: task.id } },
      });
      if (count >= targetColumn.wipLimit && fromColumnId !== body.columnId) {
        throw new ApiError(409, `"${targetColumn.name}" is at its WIP limit of ${targetColumn.wipLimit}`);
      }
    }

    const updated = await prisma.task.update({
      where: { id: params.taskId },
      data: { columnId: body.columnId, order: body.order },
    });

    await publishEvent({
      type: "task.moved",
      room: rooms.board(task.boardId),
      payload: { taskId: task.id, fromColumnId, toColumnId: body.columnId, order: body.order },
    });

    if (fromColumnId !== body.columnId) {
      await recordAudit({
        orgId: task.project.workspace.orgId,
        actorId: user.id,
        action: "task.moved",
        entityType: "task",
        entityId: task.id,
        metadata: { from: fromColumnId, to: body.columnId, ref: `${task.project.key}-${task.number}` },
      });
    }

    return json({ task: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

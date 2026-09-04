import { NextRequest } from "next/server";
import { can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { rooms } from "@taskforge/shared";

async function loadColumnWithProject(columnId: string) {
  const column = await prisma.boardColumn.findUniqueOrThrow({
    where: { id: columnId },
    include: { board: { include: { project: true } } },
  });
  return column;
}

export async function PATCH(req: NextRequest, { params }: { params: { columnId: string } }) {
  try {
    const user = await requireUser();
    const column = await loadColumnWithProject(params.columnId);
    const role = await getProjectRole(user.id, column.board.project.id);
    if (!can(role, "board.manageColumns")) throw new ApiError(403, "Not authorized to manage columns");

    const body = (await req.json()) as { name?: string; color?: string; wipLimit?: number | null; order?: number };
    const updated = await prisma.boardColumn.update({
      where: { id: params.columnId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.wipLimit !== undefined ? { wipLimit: body.wipLimit } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });

    await publishEvent({
      type: "column.updated",
      room: rooms.board(column.boardId),
      payload: { boardId: column.boardId, columnId: updated.id },
    });

    return json({ column: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { columnId: string } }) {
  try {
    const user = await requireUser();
    const column = await loadColumnWithProject(params.columnId);
    const role = await getProjectRole(user.id, column.board.project.id);
    if (!can(role, "board.manageColumns")) throw new ApiError(403, "Not authorized to manage columns");

    const taskCount = await prisma.task.count({ where: { columnId: params.columnId, archivedAt: null } });
    if (taskCount > 0) throw new ApiError(409, "Move or delete all tasks out of this column first");

    await prisma.boardColumn.delete({ where: { id: params.columnId } });
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

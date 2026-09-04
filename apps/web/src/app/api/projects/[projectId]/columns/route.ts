import { NextRequest } from "next/server";
import { createColumnSchema, can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { rooms } from "@taskforge/shared";
import { recordAudit } from "@/lib/queue";

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireUser();
    const role = await getProjectRole(user.id, params.projectId);
    if (!can(role, "board.manageColumns")) throw new ApiError(403, "Not authorized to manage columns");

    const body = createColumnSchema.parse(await req.json());
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: params.projectId },
      include: { boards: true, workspace: { select: { orgId: true } } },
    });
    const board = project.boards[0];
    if (!board) throw new ApiError(404, "Board not found");

    const last = await prisma.boardColumn.findFirst({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
    });

    const column = await prisma.boardColumn.create({
      data: {
        boardId: board.id,
        name: body.name,
        color: body.color ?? "#94A3B8",
        wipLimit: body.wipLimit ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });

    await publishEvent({ type: "column.created", room: rooms.board(board.id), payload: { boardId: board.id, columnId: column.id } });
    await recordAudit({ orgId: project.workspace.orgId, actorId: user.id, action: "column.created", entityType: "column", entityId: column.id });

    return json({ column }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

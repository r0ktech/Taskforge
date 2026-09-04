import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { can, rooms } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { publishEvent } from "@/lib/realtime";
import { recordAudit } from "@/lib/queue";

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireUser();
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: params.taskId },
      include: { project: { include: { workspace: { select: { orgId: true } } } } },
    });
    const role = await getProjectRole(user.id, task.projectId);
    if (!can(role, "task.update")) throw new ApiError(403, "Not authorized to attach files to this task");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No file provided");
    if (file.size > MAX_MB * 1024 * 1024) throw new ApiError(413, `File exceeds the ${MAX_MB}MB limit`);

    const uploadDir = path.join(process.cwd(), "public", "uploads", task.projectId);
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name).slice(0, 12);
    const storedName = `${nanoid(12)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, storedName), buffer);

    const fileUrl = `/uploads/${task.projectId}/${storedName}`;
    const attachment = await prisma.attachment.create({
      data: {
        taskId: task.id,
        uploaderId: user.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });

    await publishEvent({ type: "task.updated", room: rooms.board(task.boardId), payload: { taskId: task.id, fields: { attachment: attachment.id } } });
    await recordAudit({
      orgId: task.project.workspace.orgId,
      actorId: user.id,
      action: "attachment.uploaded",
      entityType: "task",
      entityId: task.id,
      metadata: { fileName: file.name },
    });

    return json({ attachment }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { createProjectSchema, can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getWorkspaceRole } from "@/lib/permissions";
import { recordAudit } from "@/lib/queue";

const DEFAULT_COLUMNS = [
  { name: "Backlog", color: "#94A3B8", order: 0, isDoneColumn: false },
  { name: "To Do", color: "#64748B", order: 1, isDoneColumn: false },
  { name: "In Progress", color: "#6366F1", order: 2, isDoneColumn: false },
  { name: "In Review", color: "#F59E0B", order: 3, isDoneColumn: false },
  { name: "Done", color: "#10B981", order: 4, isDoneColumn: true },
];

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await requireUser();
    const role = await getWorkspaceRole(user.id, params.workspaceId);
    if (!can(role, "project.create")) throw new ApiError(403, "Not authorized to create projects");

    const body = createProjectSchema.parse(await req.json());
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: params.workspaceId } });

    const existingKey = await prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId: params.workspaceId, key: body.key } },
    });
    if (existingKey) throw new ApiError(409, `Project key "${body.key}" is already used in this workspace`);

    const project = await prisma.project.create({
      data: {
        workspaceId: params.workspaceId,
        teamId: body.teamId ?? null,
        name: body.name,
        key: body.key,
        description: body.description,
        color: body.color ?? "#6366F1",
        members: { create: { userId: user.id, role: "ADMIN" } },
        boards: {
          create: {
            name: "Main Board",
            columns: { create: DEFAULT_COLUMNS },
          },
        },
      },
      include: { boards: true },
    });

    await recordAudit({
      orgId: workspace.orgId,
      actorId: user.id,
      action: "project.created",
      entityType: "project",
      entityId: project.id,
      metadata: { name: project.name, key: project.key },
    });

    return json({ project }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

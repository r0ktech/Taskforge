import { NextRequest } from "next/server";
import { createTeamSchema, can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getWorkspaceRole } from "@/lib/permissions";
import { recordAudit } from "@/lib/queue";

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await requireUser();
    const role = await getWorkspaceRole(user.id, params.workspaceId);
    if (!can(role, "team.create")) throw new ApiError(403, "Not authorized to create teams");

    const body = createTeamSchema.parse(await req.json());
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: params.workspaceId } });

    const team = await prisma.team.create({
      data: {
        workspaceId: params.workspaceId,
        name: body.name,
        description: body.description,
        color: body.color ?? "#0EA5E9",
        members: { create: { userId: user.id, role: "ADMIN" } },
      },
    });

    await recordAudit({
      orgId: workspace.orgId,
      actorId: user.id,
      action: "team.created",
      entityType: "team",
      entityId: team.id,
      metadata: { name: team.name },
    });

    return json({ team }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

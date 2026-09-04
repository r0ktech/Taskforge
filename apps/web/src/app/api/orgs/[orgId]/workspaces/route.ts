import { NextRequest } from "next/server";
import { createWorkspaceSchema, can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getOrgRole } from "@/lib/permissions";
import { recordAudit } from "@/lib/queue";
import { slugify } from "@/lib/slug";

export async function POST(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const role = await getOrgRole(user.id, params.orgId);
    if (!can(role, "workspace.create")) throw new ApiError(403, "Not authorized to create workspaces");

    const body = createWorkspaceSchema.parse(await req.json());
    const baseSlug = slugify(body.name);
    let slug = baseSlug;
    let n = 1;
    while (await prisma.workspace.findUnique({ where: { orgId_slug: { orgId: params.orgId, slug } } })) {
      slug = `${baseSlug}-${++n}`;
    }

    const workspace = await prisma.workspace.create({
      data: {
        orgId: params.orgId,
        name: body.name,
        slug,
        description: body.description,
        color: body.color ?? "#6366F1",
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });

    await recordAudit({
      orgId: params.orgId,
      actorId: user.id,
      action: "workspace.created",
      entityType: "workspace",
      entityId: workspace.id,
      metadata: { name: workspace.name },
    });

    return json({ workspace }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

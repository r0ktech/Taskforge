import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getOrgRole } from "@/lib/permissions";

// Reads the session cookie on every request — never statically prerendered.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const orgId = searchParams.get("orgId");
    if (!orgId) throw new ApiError(400, "orgId is required");
    if (!(await getOrgRole(user.id, orgId))) throw new ApiError(403, "Not a member of this organization");

    if (q.length < 2) return json({ tasks: [], projects: [], members: [] });

    const workspaceIds = (
      await prisma.workspace.findMany({ where: { orgId }, select: { id: true } })
    ).map((w) => w.id);

    const [tasks, projects, members] = await Promise.all([
      prisma.task.findMany({
        where: {
          archivedAt: null,
          project: { workspaceId: { in: workspaceIds } },
          OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
        },
        include: { project: { select: { key: true, id: true, name: true, workspaceId: true } } },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          archivedAt: null,
          OR: [{ name: { contains: q, mode: "insensitive" } }, { key: { contains: q, mode: "insensitive" } }],
        },
        take: 5,
      }),
      prisma.organizationMember.findMany({
        where: {
          orgId,
          user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
        },
        include: { user: { select: { id: true, name: true, email: true, avatarColor: true, avatarUrl: true } } },
        take: 5,
      }),
    ]);

    return json({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        ref: `${t.project.key}-${t.number}`,
        projectId: t.projectId,
        workspaceId: t.project.workspaceId,
      })),
      projects,
      members: members.map((m) => m.user),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

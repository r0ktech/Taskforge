import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getWorkspaceRole } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await requireUser();
    const role = await getWorkspaceRole(user.id, params.workspaceId);
    if (!role) throw new ApiError(403, "Not a member of this workspace");

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: params.workspaceId },
      include: {
        org: { select: { id: true, name: true, slug: true } },
        teams: {
          orderBy: { createdAt: "asc" },
          include: { _count: { select: { members: true, projects: true } } },
        },
        projects: {
          where: { archivedAt: null },
          orderBy: { createdAt: "asc" },
          include: {
            team: { select: { id: true, name: true, color: true } },
            _count: { select: { tasks: true, members: true } },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } },
        },
      },
    });

    return json({ workspace: { ...workspace, myRole: role } });
  } catch (err) {
    return handleApiError(err);
  }
}

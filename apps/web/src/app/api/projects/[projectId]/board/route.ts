import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireUser();
    const role = await getProjectRole(user.id, params.projectId);
    if (!role) throw new ApiError(403, "Not a member of this project");

    const project = await prisma.project.findUniqueOrThrow({
      where: { id: params.projectId },
      include: {
        labels: true,
        members: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
        boards: {
          include: {
            columns: {
              orderBy: { order: "asc" },
              include: {
                tasks: {
                  where: { archivedAt: null },
                  orderBy: { order: "asc" },
                  include: {
                    assignees: { include: { user: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } } },
                    labels: { include: { label: true } },
                    _count: { select: { comments: true, attachments: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return json({ project: { ...project, myRole: role } });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getOrgRole } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const role = await getOrgRole(user.id, params.orgId);
    if (!role) throw new ApiError(403, "Not a member of this organization");

    const members = await prisma.organizationMember.findMany({
      where: { orgId: params.orgId },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true, avatarUrl: true, title: true } } },
      orderBy: { createdAt: "asc" },
    });

    return json({ members: members.map((m) => ({ ...m.user, role: m.role, memberSince: m.createdAt })) });
  } catch (err) {
    return handleApiError(err);
  }
}

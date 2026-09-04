import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { recordAudit } from "@/lib/queue";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: { org: { select: { name: true, slug: true } }, invitedBy: { select: { name: true } } },
    });
    if (!invitation) throw new ApiError(404, "Invitation not found");
    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      throw new ApiError(410, "This invitation is no longer valid");
    }
    return json({ invitation });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  try {
    const user = await requireUser();
    const invitation = await prisma.invitation.findUnique({ where: { token: params.token } });
    if (!invitation) throw new ApiError(404, "Invitation not found");
    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      throw new ApiError(410, "This invitation is no longer valid");
    }
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ApiError(403, "This invitation was sent to a different email address");
    }

    await prisma.$transaction([
      prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId: invitation.orgId, userId: user.id } },
        update: {},
        create: { orgId: invitation.orgId, userId: user.id, role: invitation.role },
      }),
      prisma.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } }),
    ]);

    await recordAudit({
      orgId: invitation.orgId,
      actorId: user.id,
      action: "invitation.accepted",
      entityType: "invitation",
      entityId: invitation.id,
    });

    const org = await prisma.organization.findUnique({ where: { id: invitation.orgId } });
    return json({ orgSlug: org?.slug });
  } catch (err) {
    return handleApiError(err);
  }
}

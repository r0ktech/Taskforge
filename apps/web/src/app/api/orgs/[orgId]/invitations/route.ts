import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { inviteMemberSchema } from "@taskforge/shared";
import { can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getOrgRole } from "@/lib/permissions";
import { enqueueEmail, recordAudit } from "@/lib/queue";

export async function GET(_req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const role = await getOrgRole(user.id, params.orgId);
    if (!can(role, "invitation.send")) throw new ApiError(403, "Not authorized");

    const invitations = await prisma.invitation.findMany({
      where: { orgId: params.orgId, status: "PENDING" },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return json({ invitations });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const role = await getOrgRole(user.id, params.orgId);
    if (!can(role, "invitation.send")) throw new ApiError(403, "Not authorized to invite members");

    const body = inviteMemberSchema.parse(await req.json());
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: params.orgId } });

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      const already = await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: params.orgId, userId: existingUser.id } },
      });
      if (already) throw new ApiError(409, "That person is already a member");
    }

    const token = nanoid(32);
    const invitation = await prisma.invitation.create({
      data: {
        orgId: params.orgId,
        email: body.email,
        role: body.role,
        token,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await Promise.all([
      enqueueEmail({
        name: "invitation",
        to: body.email,
        data: { orgName: org.name, inviterName: user.name, role: body.role, token },
      }),
      recordAudit({
        orgId: params.orgId,
        actorId: user.id,
        action: "invitation.sent",
        entityType: "invitation",
        entityId: invitation.id,
        metadata: { email: body.email, role: body.role },
      }),
    ]);

    return json({ invitation }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

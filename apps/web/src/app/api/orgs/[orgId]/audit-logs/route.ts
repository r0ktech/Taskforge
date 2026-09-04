import { NextRequest } from "next/server";
import { can } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getOrgRole } from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const role = await getOrgRole(user.id, params.orgId);
    if (!can(role, "auditLog.view")) throw new ApiError(403, "Not authorized to view the audit log");

    const { searchParams } = new URL(req.url);
    const actorId = searchParams.get("actorId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = 30;

    const logs = await prisma.auditLog.findMany({
      where: {
        orgId: params.orgId,
        ...(actorId ? { actorId } : {}),
        ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      },
      include: { actor: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = logs.length > take;
    const page = hasMore ? logs.slice(0, take) : logs;

    return json({ logs: page, nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification || notification.recipientId !== user.id) throw new ApiError(404, "Notification not found");
    await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

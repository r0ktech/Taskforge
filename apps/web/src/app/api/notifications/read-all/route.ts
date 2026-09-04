import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json } from "@/lib/api-helpers";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({ where: { recipientId: user.id, isRead: false }, data: { isRead: true } });
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

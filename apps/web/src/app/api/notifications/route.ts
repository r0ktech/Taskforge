import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json } from "@/lib/api-helpers";

// Reads the session cookie on every request — never statically prerendered.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: user.id },
        include: { actor: { select: { id: true, name: true, avatarColor: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { recipientId: user.id, isRead: false } }),
    ]);
    return json({ notifications, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}

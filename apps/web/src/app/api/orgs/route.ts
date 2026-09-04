import { prisma } from "@/lib/db";
import { requireUser, handleApiError, json } from "@/lib/api-helpers";

// Reads the session cookie on every request — never statically prerendered.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        org: {
          include: {
            workspaces: {
              orderBy: { createdAt: "asc" },
              select: { id: true, name: true, slug: true, color: true, icon: true },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return json({
      organizations: memberships.map((m) => ({
        id: m.org.id,
        name: m.org.name,
        slug: m.org.slug,
        role: m.role,
        memberCount: m.org._count.members,
        workspaces: m.org.workspaces,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

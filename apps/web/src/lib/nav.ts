import { prisma } from "./db";

export async function getUserOrgsWithWorkspaces(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          workspaces: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.org.id,
    name: m.org.name,
    slug: m.org.slug,
    role: m.role,
    workspaces: m.org.workspaces,
  }));
}

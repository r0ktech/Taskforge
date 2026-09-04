import { NextRequest } from "next/server";
import { signupSchema } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { handleApiError, json, ApiError } from "@/lib/api-helpers";
import { enqueueEmail, recordAudit } from "@/lib/queue";
import { slugify } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const body = signupSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError(409, "An account with that email already exists");

    const passwordHash = await hashPassword(body.password);

    const baseSlug = slugify(body.orgName);
    let slug = baseSlug;
    let n = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++n}`;
    }

    const { user, org } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: body.name, email: body.email, passwordHash },
      });
      const org = await tx.organization.create({
        data: { name: body.orgName, slug },
      });
      await tx.organizationMember.create({
        data: { orgId: org.id, userId: user.id, role: "OWNER" },
      });
      const workspace = await tx.workspace.create({
        data: { orgId: org.id, name: "General", slug: "general", description: "Your default workspace." },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
      });
      return { user, org };
    });

    await createSession(user.id, user.email, {
      userAgent: req.headers.get("user-agent"),
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    await Promise.all([
      enqueueEmail({ name: "welcome", to: user.email, data: { name: user.name, orgName: org.name } }),
      recordAudit({ orgId: org.id, actorId: user.id, action: "organization.created", entityType: "organization", entityId: org.id }),
    ]);

    return json({ user: { id: user.id, name: user.name, email: user.email }, org: { id: org.id, slug: org.slug } }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

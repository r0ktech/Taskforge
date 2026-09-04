import { NextRequest } from "next/server";
import { loginSchema } from "@taskforge/shared";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { handleApiError, json, ApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    await createSession(user.id, user.email, {
      userAgent: req.headers.get("user-agent"),
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return handleApiError(err);
  }
}

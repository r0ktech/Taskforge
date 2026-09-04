import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "tf_session";
const SESSION_TTL_DAYS = 30;

export interface SessionPayload {
  sub: string; // userId
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Issues a JWT, persists a revocable Session row, and sets the http-only cookie. */
export async function createSession(
  userId: string,
  email: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null }
): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const token = jwt.sign({ sub: userId, email } satisfies SessionPayload, JWT_SECRET, {
    expiresIn: `${SESSION_TTL_DAYS}d`,
  });

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}

/** Verifies the session cookie's JWT and that its Session row hasn't been revoked/expired. */
export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }

  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user;
}

/** Mints a short-lived token for Socket.IO handshake auth, reusing the same secret. */
export function signSocketToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email } satisfies SessionPayload, JWT_SECRET, { expiresIn: "1h" });
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

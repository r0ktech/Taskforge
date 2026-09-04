import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __taskforge_prisma__: PrismaClient | undefined;
}

// Reuse a single PrismaClient across hot-reloads in dev so we don't exhaust
// the Postgres connection pool.
export const prisma =
  global.__taskforge_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__taskforge_prisma__ = prisma;
}

export * from "@prisma/client";

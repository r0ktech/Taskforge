import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  return user;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 422 });
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data as object, typeof init === "number" ? { status: init } : init);
}

import { destroySession } from "@/lib/auth";
import { json, handleApiError } from "@/lib/api-helpers";

export async function POST() {
  try {
    await destroySession();
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

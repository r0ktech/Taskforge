import { getSessionUser } from "@/lib/auth";
import { signSocketToken } from "@/lib/auth";
import { json } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null }, 200);
  return json({
    user: { id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor, avatarUrl: user.avatarUrl },
    socketToken: signSocketToken(user.id, user.email),
  });
}

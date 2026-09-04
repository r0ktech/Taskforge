import { requireUser, handleApiError, json, ApiError } from "@/lib/api-helpers";
import { getProjectRole } from "@/lib/permissions";
import { getProjectAnalytics } from "@/lib/analytics";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireUser();
    const role = await getProjectRole(user.id, params.projectId);
    if (!role) throw new ApiError(403, "Not authorized");

    const analytics = await getProjectAnalytics(params.projectId);
    return json(analytics);
  } catch (err) {
    return handleApiError(err);
  }
}

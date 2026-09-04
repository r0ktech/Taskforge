import { redirect } from "next/navigation";

export default function ProjectRedirectPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  redirect(`/workspaces/${params.workspaceId}/projects/${params.projectId}/board`);
}

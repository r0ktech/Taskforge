import { prisma } from "./db";
import { highestRole, type Role } from "@taskforge/shared";

export { can, roleAtLeast } from "@taskforge/shared";
export type { Role, Permission } from "@taskforge/shared";

export async function getOrgRole(userId: string, orgId: string): Promise<Role | null> {
  const m = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  return (m?.role as Role) ?? null;
}

export async function getWorkspaceRole(userId: string, workspaceId: string): Promise<Role | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { orgId: true },
  });
  if (!workspace) return null;

  const [orgRole, wsMember] = await Promise.all([
    getOrgRole(userId, workspace.orgId),
    prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } }),
  ]);

  return highestRole(orgRole, wsMember?.role as Role | undefined);
}

export async function getProjectRole(userId: string, projectId: string): Promise<Role | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true, teamId: true },
  });
  if (!project) return null;

  const [wsRole, teamMember, projectMember] = await Promise.all([
    getWorkspaceRole(userId, project.workspaceId),
    project.teamId
      ? prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: project.teamId, userId } } })
      : Promise.resolve(null),
    prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }),
  ]);

  return highestRole(wsRole, teamMember?.role as Role | undefined, projectMember?.role as Role | undefined);
}

export async function getTaskProjectId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  return task?.projectId ?? null;
}

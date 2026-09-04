/**
 * Role-based permission model.
 *
 * A single `Role` enum (OWNER > ADMIN > MEMBER > VIEWER) is reused at every
 * scope — organization, workspace, team, and project. A user's effective
 * role at a scope is the highest role granted to them at that scope or any
 * ancestor scope (org role flows down, but a more specific grant can raise
 * — never lower — their access at that narrower scope).
 */

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function highestRole(...roles: Array<Role | null | undefined>): Role | null {
  let best: Role | null = null;
  for (const r of roles) {
    if (!r) continue;
    if (!best || ROLE_RANK[r] > ROLE_RANK[best]) best = r;
  }
  return best;
}

/** Permission actions the app checks against a resolved role. */
export const PERMISSIONS = {
  "org.manageMembers": "ADMIN",
  "org.manageBilling": "OWNER",
  "org.delete": "OWNER",
  "workspace.create": "ADMIN",
  "workspace.update": "ADMIN",
  "workspace.delete": "OWNER",
  "workspace.manageMembers": "ADMIN",
  "team.create": "ADMIN",
  "team.manageMembers": "ADMIN",
  "project.create": "MEMBER",
  "project.update": "ADMIN",
  "project.delete": "OWNER",
  "project.manageMembers": "ADMIN",
  "board.manageColumns": "ADMIN",
  "task.create": "MEMBER",
  "task.update": "MEMBER",
  "task.move": "MEMBER",
  "task.delete": "ADMIN",
  "comment.create": "MEMBER",
  "comment.delete": "ADMIN",
  "invitation.send": "ADMIN",
  "invitation.revoke": "ADMIN",
  "auditLog.view": "ADMIN",
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return roleAtLeast(role, PERMISSIONS[permission]);
}

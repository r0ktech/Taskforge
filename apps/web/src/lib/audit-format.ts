const VERB_MAP: Record<string, string> = {
  "organization.created": "created the organization",
  "workspace.created": "created a workspace",
  "team.created": "created a team",
  "project.created": "created a project",
  "column.created": "added a board column",
  "task.created": "created a task",
  "task.updated": "updated a task",
  "task.moved": "moved a task",
  "task.deleted": "deleted a task",
  "comment.created": "left a comment",
  "attachment.uploaded": "uploaded a file",
  "invitation.sent": "invited a member",
  "invitation.accepted": "accepted an invitation",
};

export function formatAuditAction(action: string): string {
  return VERB_MAP[action] ?? action.replace(/[._]/g, " ");
}

import type { EmailJobData } from "@taskforge/shared";

const shell = (title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#111827;padding:20px 28px;">
            <span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.01em;">Task&nbsp;Forge</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">${title}</h1>
            <div style="font-size:14px;line-height:1.6;color:#4b5563;">${bodyHtml}</div>
            ${
              ctaLabel && ctaUrl
                ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;background:#6366F1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;">${ctaLabel}</a>`
                : ""
            }
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #f1f1f4;">
            <span style="font-size:12px;color:#9ca3af;">You're receiving this because you're a member of a Task Forge organization.</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export function renderEmail(job: EmailJobData): { subject: string; html: string } {
  const d = job.data as Record<string, string>;
  switch (job.name) {
    case "welcome":
      return {
        subject: `Welcome to Task Forge, ${d.name}`,
        html: shell(
          `Welcome aboard, ${d.name} 👋`,
          `Your organization <strong>${d.orgName}</strong> is ready. Create a workspace, invite your team, and spin up your first board.`,
          "Open Task Forge",
          APP_URL
        ),
      };
    case "mention":
      return {
        subject: `${d.actorName} mentioned you in ${d.taskRef}`,
        html: shell(
          `${d.actorName} mentioned you`,
          `In <strong>${d.taskRef}</strong> — ${d.taskTitle}:<br/><blockquote style="margin:12px 0;padding:10px 14px;background:#f9fafb;border-left:3px solid #6366F1;border-radius:4px;">${d.excerpt}</blockquote>`,
          "View comment",
          `${APP_URL}${d.link ?? ""}`
        ),
      };
    case "comment":
      return {
        subject: `New comment on ${d.taskRef}`,
        html: shell(
          `${d.actorName} commented on ${d.taskRef}`,
          `<blockquote style="margin:12px 0;padding:10px 14px;background:#f9fafb;border-left:3px solid #6366F1;border-radius:4px;">${d.excerpt}</blockquote>`,
          "View task",
          `${APP_URL}${d.link ?? ""}`
        ),
      };
    case "assigned":
      return {
        subject: `You were assigned to ${d.taskRef}`,
        html: shell(
          `${d.actorName} assigned you a task`,
          `<strong>${d.taskRef}</strong> — ${d.taskTitle}`,
          "View task",
          `${APP_URL}${d.link ?? ""}`
        ),
      };
    case "invitation":
      return {
        subject: `You've been invited to join ${d.orgName} on Task Forge`,
        html: shell(
          `Join ${d.orgName} on Task Forge`,
          `${d.inviterName} invited you to collaborate as <strong>${d.role}</strong>.`,
          "Accept invitation",
          `${APP_URL}/invite/${d.token}`
        ),
      };
    case "task-due-soon":
      return {
        subject: `${d.taskRef} is due soon`,
        html: shell(
          `Heads up — ${d.taskRef} is due soon`,
          `${d.taskTitle} is due ${d.dueDate}.`,
          "View task",
          `${APP_URL}${d.link ?? ""}`
        ),
      };
    default:
      return { subject: "Task Forge notification", html: shell("Notification", "You have a new update.") };
  }
}

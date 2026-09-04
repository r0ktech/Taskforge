import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getMyWorkOverview } from "@/lib/queries";
import { getUserOrgsWithWorkspaces } from "@/lib/nav";
import { formatAuditAction } from "@/lib/audit-format";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PRIORITY_META } from "@/lib/priority";
import { formatDistanceToNowStrict } from "date-fns";
import { CalendarClock, ArrowRight, Sparkles } from "lucide-react";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [{ openTasks, recentActivity }, orgs] = await Promise.all([
    getMyWorkOverview(user.id),
    getUserOrgsWithWorkspaces(user.id),
  ]);
  const firstOrgSlug = orgs[0]?.slug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Good to see you, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-[14px] text-ink-muted">Here's what needs your attention across every project.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">Your open tasks</h2>
            <span className="text-[12px] text-ink-faint">{openTasks.length} total</span>
          </div>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
            {openTasks.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <Sparkles className="h-5 w-5 text-ink-faint" />
                <p className="text-[13px] text-ink-muted">Nothing assigned to you right now. Enjoy it.</p>
              </div>
            )}
            {openTasks.map((task) => {
              const meta = PRIORITY_META[task.priority];
              return (
                <Link
                  key={task.id}
                  href={`/workspaces/${task.project.workspaceId}/projects/${task.project.id}/board?task=${task.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-raised"
                >
                  <span className="font-mono text-[11px] text-ink-faint">{task.project.key}-{task.number}</span>
                  <span className="min-w-0 flex-1 basis-[60%] truncate text-[13px] text-ink">{task.title}</span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                      <CalendarClock className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-[15px] font-semibold text-ink">Recent activity</h2>
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-surface p-4">
            {recentActivity.length === 0 && <p className="text-[13px] text-ink-faint">No activity yet.</p>}
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                {log.actor && <Avatar name={log.actor.name} color={log.actor.avatarColor} size="xs" />}
                <p className="text-[12.5px] leading-snug text-ink-muted">
                  <span className="font-medium text-ink">{log.actor?.name ?? "Someone"}</span> {formatAuditAction(log.action)}
                  <span className="block text-[11px] text-ink-faint">{formatDistanceToNowStrict(log.createdAt)} ago</span>
                </p>
              </div>
            ))}
          </div>
          {firstOrgSlug && (
            <Link
              href={`/orgs/${firstOrgSlug}/audit-log`}
              className="mt-2 flex items-center gap-1 px-1 text-[12px] font-medium text-accent hover:underline"
            >
              View full audit log <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

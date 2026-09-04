"use client";
import * as React from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatAuditAction } from "@/lib/audit-format";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; name: string; avatarColor: string } | null;
}
interface Member {
  id: string;
  name: string;
}

export function AuditLogClient({ orgId, initialLogs, initialCursor, members }: { orgId: string; initialLogs: LogEntry[]; initialCursor: string | null; members: Member[] }) {
  const [logs, setLogs] = React.useState(initialLogs);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [actorId, setActorId] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(false);

  async function fetchPage(reset: boolean) {
    setLoading(true);
    const params = new URLSearchParams();
    if (actorId !== "all") params.set("actorId", actorId);
    if (!reset && cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/orgs/${orgId}/audit-logs?${params.toString()}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return;
    setLogs((prev) => (reset ? data.logs : [...prev, ...data.logs]));
    setCursor(data.nextCursor);
  }

  React.useEffect(() => {
    void fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            <ShieldCheck className="h-5 w-5 text-accent" /> Audit log
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">A complete, filterable trail of every meaningful action.</p>
        </div>
        <Select value={actorId} onValueChange={setActorId}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
        {logs.length === 0 && !loading && <p className="px-4 py-10 text-center text-[13px] text-ink-faint">No activity recorded yet.</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
            {log.actor ? (
              <Avatar name={log.actor.name} color={log.actor.avatarColor} size="sm" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-surface-raised" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink">
                <span className="font-medium">{log.actor?.name ?? "System"}</span> {formatAuditAction(log.action)}
              </p>
              <p className="text-[11px] text-ink-faint">
                {log.entityType}
                {log.metadata ? ` · ${JSON.stringify(log.metadata).slice(0, 80)}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-ink-faint">{formatDistanceToNowStrict(new Date(log.createdAt))} ago</span>
          </div>
        ))}
      </div>

      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => fetchPage(false)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";
import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Cell,
  LabelList,
} from "recharts";
import { AlertTriangle, CheckCircle2, ListTodo, Users2 } from "lucide-react";
import { PRIORITY_META } from "@/lib/priority";

interface AnalyticsData {
  byColumn: { columnId: string; name: string; color: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  throughput: { date: string; completed: number }[];
  overdue: number;
  totalOpen: number;
  totalDone: number;
  workload: { userId: string; name: string; color: string; count: number }[];
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon className={`h-4 w-4 ${tone === "danger" && value > 0 ? "text-danger" : ""}`} />
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className={`mt-2 font-display text-2xl font-semibold ${tone === "danger" && value > 0 ? "text-danger" : "text-ink"}`}>{value}</p>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--surface-raised))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--ink))",
};

export function AnalyticsClient({ data, teamSize }: { data: AnalyticsData; teamSize: number }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">Analytics</h1>
      <p className="mt-1 text-[13px] text-ink-muted">How work is flowing through this project.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={ListTodo} label="Open tasks" value={data.totalOpen} />
        <StatTile icon={CheckCircle2} label="Completed" value={data.totalDone} />
        <StatTile icon={AlertTriangle} label="Overdue" value={data.overdue} tone="danger" />
        <StatTile icon={Users2} label="Team size" value={teamSize} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="font-display text-[13px] font-semibold text-ink">Tasks by column</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byColumn} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--ink-faint))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "hsl(var(--ink-muted))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--surface-raised))" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.byColumn.map((c) => (
                    <Cell key={c.columnId} fill={c.color} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "hsl(var(--ink-muted))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="font-display text-[13px] font-semibold text-ink">Open tasks by priority</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPriority.map((p) => ({ ...p, label: PRIORITY_META[p.priority as keyof typeof PRIORITY_META].label }))} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--ink-faint))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12, fill: "hsl(var(--ink-muted))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--surface-raised))" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.byPriority.map((p) => (
                    <Cell key={p.priority} fill={PRIORITY_META[p.priority as keyof typeof PRIORITY_META].dot} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "hsl(var(--ink-muted))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:col-span-2">
          <h2 className="font-display text-[13px] font-semibold text-ink">Throughput — last 14 days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.throughput} margin={{ left: 4, right: 16, top: 4 }}>
                <defs>
                  <linearGradient id="tf-throughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--ink-faint))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--ink-faint))" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="completed" name="Tasks completed" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#tf-throughput)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:col-span-2">
          <h2 className="font-display text-[13px] font-semibold text-ink">Open workload by assignee</h2>
          {data.workload.length === 0 ? (
            <p className="mt-4 text-[13px] text-ink-faint">Nothing assigned right now.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {data.workload.map((w) => {
                const max = Math.max(...data.workload.map((x) => x.count), 1);
                return (
                  <div key={w.userId} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 truncate sm:w-28 text-[12.5px] text-ink-muted">{w.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                      <div className="h-full rounded-full" style={{ width: `${(w.count / max) * 100}%`, backgroundColor: w.color }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[12px] text-ink-faint">{w.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

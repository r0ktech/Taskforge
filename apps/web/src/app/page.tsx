import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  KanbanSquare,
  MessagesSquare,
  ShieldCheck,
  Radio,
  BarChart3,
  Users,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-canvas font-display text-sm font-bold">
            T
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Task Forge</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="tf-focus-ring rounded-md px-3.5 py-2 text-sm font-medium text-ink-muted hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="tf-focus-ring inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-canvas hover:brightness-110"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-14 pt-10 text-center sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium text-ink-muted">
          <Radio className="h-3 w-3 text-accent" /> Real-time boards, live for every teammate
        </div>
        <h1 className="text-balance font-display text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[44px] lg:text-[58px]">
          Plan the work.
          <br />
          <span className="text-accent">Ship it together.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-ink-muted sm:mt-6 sm:text-[17px]">
          Organizations, workspaces, teams, and projects — with Kanban boards that update
          instantly, audit trails you can trust, and notifications that reach people where
          they work.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="tf-focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-[14px] font-semibold text-white shadow-subtle hover:bg-accent-hover"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="tf-focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink hover:bg-surface-raised"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-6 sm:pb-16">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
          <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-3 text-[12px] text-ink-faint">taskforge.dev/w/product/eng/board</span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
            {["Backlog", "In Progress", "Done"].map((col, i) => (
              <div key={col} className="rounded-lg border border-border bg-canvas p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-muted">{col}</span>
                  <span className="rounded-full bg-surface-raised px-1.5 text-[10px] text-ink-faint">{3 - i}</span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 - i }).map((_, j) => (
                    <div key={j} className="rounded-md border border-border bg-surface p-2.5 shadow-subtle">
                      <div className="mb-2 h-2 w-3/4 rounded-full bg-border" />
                      <div className="h-2 w-1/2 rounded-full bg-border" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6 sm:pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: KanbanSquare, title: "Real-time Kanban", desc: "Drag a card and every teammate sees it move instantly over WebSockets." },
            { icon: Users, title: "Orgs, workspaces, teams", desc: "Model your company's actual structure, with role-based access at every level." },
            { icon: MessagesSquare, title: "Comments & mentions", desc: "@mention a teammate and they're notified in-app and by email." },
            { icon: ShieldCheck, title: "Audit log", desc: "Every meaningful action is recorded — who did what, and when." },
            { icon: BarChart3, title: "Analytics", desc: "Throughput, workload, and priority breakdowns per project." },
            { icon: Radio, title: "Background workers", desc: "Email and audit writes run off the request path via Redis-backed queues." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border bg-surface p-5">
              <Icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-[12px] text-ink-faint">
        Task Forge — a demo project management platform.
      </footer>
    </div>
  );
}

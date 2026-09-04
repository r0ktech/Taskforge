import Link from "next/link";
import { KanbanSquare, Radio, ShieldCheck } from "lucide-react";

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-16 sm:py-12">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-canvas font-display text-sm font-bold">
            T
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Task Forge</span>
        </Link>
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.35),transparent_45%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.25),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <div />
          <div className="max-w-md">
            <p className="font-display text-2xl font-medium leading-snug text-white">
              "Task Forge is the first tool where everyone actually looks at the board —
              because it updates while they're looking at it."
            </p>
            <p className="mt-4 text-sm text-white/60">Head of Product, Task Forge Labs</p>
          </div>
          <div className="flex gap-6 text-white/70">
            <div className="flex items-center gap-2 text-[13px]">
              <Radio className="h-4 w-4" /> Live boards
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <KanbanSquare className="h-4 w-4" /> Kanban-native
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <ShieldCheck className="h-4 w-4" /> Full audit trail
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Hash, FolderKanban, User as UserIcon, Loader2 } from "lucide-react";
import { useActiveOrg } from "@/providers/ActiveOrgProvider";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<{ tasks: any[]; projects: any[]; members: any[] }>({
    tasks: [],
    projects: [],
    members: [],
  });
  const { activeOrg } = useActiveOrg();
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open || !activeOrg || query.trim().length < 2) {
      setResults({ tasks: [], projects: [], members: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&orgId=${activeOrg.id}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, activeOrg]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-4 pt-[10vh] backdrop-blur-[2px] sm:pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-ink-faint" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search tasks, projects, and people..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-faint" />}
            <kbd className="rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink-faint">esc</kbd>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            {query.trim().length < 2 && (
              <p className="px-2 py-8 text-center text-[13px] text-ink-faint">Type at least 2 characters to search.</p>
            )}
            {results.tasks.length > 0 && (
              <Command.Group heading="Tasks" className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                {results.tasks.map((t) => (
                  <Command.Item
                    key={t.id}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/workspaces/${t.workspaceId}/projects/${t.projectId}/board?task=${t.id}`);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink data-[selected=true]:bg-accent-muted"
                  >
                    <Hash className="h-3.5 w-3.5 text-ink-faint" />
                    <span className="font-mono text-[11px] text-ink-faint">{t.ref}</span>
                    <span className="truncate">{t.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {results.projects.length > 0 && (
              <Command.Group heading="Projects" className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                {results.projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/workspaces/${p.workspaceId}/projects/${p.id}/board`);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink data-[selected=true]:bg-accent-muted"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-ink-faint" />
                    <span>{p.name}</span>
                    <span className="font-mono text-[11px] text-ink-faint">{p.key}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {results.members.length > 0 && (
              <Command.Group heading="People" className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                {results.members.map((m) => (
                  <Command.Item
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink data-[selected=true]:bg-accent-muted"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-ink-faint" />
                    <span>{m.name}</span>
                    <span className="text-[12px] text-ink-faint">{m.email}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

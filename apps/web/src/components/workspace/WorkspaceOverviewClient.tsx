"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, FolderKanban, Users2, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AvatarStack } from "@/components/ui/Avatar";
import { NewTeamDialog } from "./NewTeamDialog";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";
import { can, type Role } from "@taskforge/shared";

interface Team {
  id: string;
  name: string;
  color: string;
  _count: { members: number; projects: number };
}
interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  team: { id: string; name: string; color: string } | null;
  _count: { tasks: number; members: number };
}
interface Member {
  user: { id: string; name: string; avatarColor: string; avatarUrl: string | null };
}

export function WorkspaceOverviewClient({
  workspaceId,
  workspaceName,
  myRole,
  teams,
  projects,
  members,
}: {
  workspaceId: string;
  workspaceName: string;
  myRole: Role;
  teams: Team[];
  projects: Project[];
  members: Member[];
}) {
  const [newTeamOpen, setNewTeamOpen] = React.useState(false);
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{workspaceName}</h1>
          <div className="mt-2"><AvatarStack people={members.map((m) => m.user)} max={6} /></div>
        </div>
        <div className="flex shrink-0 gap-2">
          {can(myRole, "team.create") && (
            <Button variant="secondary" onClick={() => setNewTeamOpen(true)}>
              <Plus className="h-4 w-4" /> Team
            </Button>
          )}
          {can(myRole, "project.create") && (
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="h-4 w-4" /> Project
            </Button>
          )}
        </div>
      </div>

      {teams.length > 0 && (
        <>
          <h2 className="mt-9 font-display text-[15px] font-semibold text-ink">Teams</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-medium text-ink">{t.name}</span>
                <span className="text-ink-faint">{t._count.members} · {t._count.projects} projects</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-9 font-display text-[15px] font-semibold text-ink">Projects</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/workspaces/${workspaceId}/projects/${p.id}/board`}
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-ink-faint"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${p.color}1A` }}>
                  <FolderKanban className="h-4 w-4" style={{ color: p.color }} />
                </div>
                <div>
                  <p className="font-display text-[14px] font-semibold text-ink group-hover:text-accent">{p.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-ink-faint"><Hash className="h-3 w-3" />{p.key}</p>
                </div>
              </div>
              {p.team && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-muted">{p.team.name}</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-faint">
              <span>{p._count.tasks} tasks</span>
              <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {p._count.members}</span>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="sm:col-span-2 rounded-lg border border-dashed border-border p-10 text-center text-[13px] text-ink-faint">
            No projects yet. Create one to spin up a Kanban board.
          </div>
        )}
      </div>

      <NewTeamDialog workspaceId={workspaceId} open={newTeamOpen} onOpenChange={setNewTeamOpen} />
      <NewProjectDialog workspaceId={workspaceId} teams={teams} open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </div>
  );
}

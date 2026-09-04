import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getOrgRole } from "@/lib/permissions";
import { FolderKanban, Layers, Plus, Users2 } from "lucide-react";

export default async function OrgHomePage({ params }: { params: { orgSlug: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    include: {
      workspaces: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { projects: true, teams: true, members: true } } },
      },
      _count: { select: { members: true } },
    },
  });
  if (!org) notFound();

  const role = await getOrgRole(user.id, org.id);
  if (!role) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{org.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-muted">
            <Users2 className="h-3.5 w-3.5" /> {org._count.members} member{org._count.members === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <h2 className="mt-9 font-display text-[15px] font-semibold text-ink">Workspaces</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {org.workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspaces/${ws.id}`}
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-ink-faint"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${ws.color}1A` }}>
                <Layers className="h-4 w-4" style={{ color: ws.color }} />
              </div>
              <span className="font-display text-[14px] font-semibold text-ink group-hover:text-accent">{ws.name}</span>
            </div>
            {ws.description && <p className="mt-2 line-clamp-2 text-[13px] text-ink-muted">{ws.description}</p>}
            <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-faint">
              <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {ws._count.projects} projects</span>
              <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {ws._count.members} members</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

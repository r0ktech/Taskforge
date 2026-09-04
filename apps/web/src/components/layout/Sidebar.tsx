"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Plus,
  LayoutGrid,
  Users2,
  ShieldCheck,
  Home,
  Check,
  Sun,
  Moon,
  LogOut,
  X,
} from "lucide-react";
import { useActiveOrg } from "@/providers/ActiveOrgProvider";
import { useSession } from "@/providers/SessionProvider";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { NewWorkspaceDialog } from "@/components/workspace/NewWorkspaceDialog";
import { cn } from "@/lib/cn";

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { orgs, activeOrg, setActiveOrgId } = useActiveOrg();
  const { user, logout } = useSession();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [newWorkspaceOpen, setNewWorkspaceOpen] = React.useState(false);

  return (
    <>
      {/* Scrim — only rendered while the mobile drawer is open */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px] animate-fade-in lg:hidden"
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "flex h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-surface",
          // Phone/tablet: fixed off-canvas drawer that slides in.
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0 shadow-panel" : "-translate-x-full lg:shadow-none"
        )}
      >
      <div className="flex items-center gap-1 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="tf-focus-ring flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-raised">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-canvas font-display text-[11px] font-bold">
                {activeOrg?.name?.[0]?.toUpperCase() ?? "T"}
              </div>
              <span className="flex-1 truncate text-left text-[13px] font-semibold text-ink">
                {activeOrg?.name ?? "Task Forge"}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-ink-faint" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => {
                  setActiveOrgId(org.id);
                  router.push(`/orgs/${org.slug}`);
                }}
              >
                <span className="flex-1 truncate">{org.name}</span>
                {activeOrg?.id === org.id && <Check className="h-3.5 w-3.5 text-accent" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="tf-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-faint hover:bg-surface-raised hover:text-ink lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <SidebarLink href="/home" icon={Home} label="Home" active={pathname === "/home"} />
        {activeOrg && (
          <>
            <SidebarLink
              href={`/orgs/${activeOrg.slug}/members`}
              icon={Users2}
              label="Members"
              active={pathname === `/orgs/${activeOrg.slug}/members`}
            />
            <SidebarLink
              href={`/orgs/${activeOrg.slug}/audit-log`}
              icon={ShieldCheck}
              label="Audit log"
              active={pathname === `/orgs/${activeOrg.slug}/audit-log`}
            />
          </>
        )}

        <div className="mt-5 flex items-center justify-between px-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Workspaces</span>
          <button
            onClick={() => setNewWorkspaceOpen(true)}
            className="tf-focus-ring rounded p-0.5 text-ink-faint hover:bg-surface-raised hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1 space-y-0.5">
          {activeOrg?.workspaces.map((ws) => (
            <SidebarLink
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              icon={LayoutGrid}
              label={ws.name}
              active={pathname?.startsWith(`/workspaces/${ws.id}`)}
              dotColor={ws.color}
            />
          ))}
          {activeOrg?.workspaces.length === 0 && (
            <p className="px-2 py-2 text-[12px] text-ink-faint">No workspaces yet.</p>
          )}
        </div>
      </nav>

      {activeOrg && (
        <NewWorkspaceDialog orgId={activeOrg.id} open={newWorkspaceOpen} onOpenChange={setNewWorkspaceOpen} />
      )}

      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="tf-focus-ring flex w-full items-center gap-2.5 rounded-md px-2 py-2 hover:bg-surface-raised">
              {user && <Avatar name={user.name} color={user.avatarColor} src={user.avatarUrl} size="sm" />}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="top">
            <DropdownMenuItem onSelect={toggle}>
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void logout()} className="text-danger focus:bg-danger/10 focus:text-danger">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  dotColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  dotColor?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "tf-focus-ring flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
        active ? "bg-accent-muted text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
      )}
    >
      {dotColor ? (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      ) : (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}

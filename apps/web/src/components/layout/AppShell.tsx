"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { CommandPalette } from "@/components/search/CommandPalette";
import { ActiveOrgProvider, type NavOrg } from "@/providers/ActiveOrgProvider";

export function AppShell({
  orgs,
  initialOrgSlug,
  children,
}: {
  orgs: NavOrg[];
  initialOrgSlug?: string;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();

  // Navigating on mobile should dismiss the drawer.
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Escape closes the drawer; also lock body scroll while it's open.
  React.useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  function openSearch() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

  return (
    <ActiveOrgProvider orgs={orgs} initialOrgSlug={initialOrgSlug}>
      <div className="flex h-[100dvh] overflow-hidden bg-canvas">
        {/* Off-canvas drawer on small screens, static column from lg up */}
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-5">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="tf-focus-ring -ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>

            {/* Full search field on desktop */}
            <button
              onClick={openSearch}
              className="tf-focus-ring hidden w-72 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-ink-faint hover:border-ink-faint sm:flex"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Search tasks, projects, people...</span>
              <kbd className="ml-auto shrink-0 rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </button>

            {/* Icon-only search on phones */}
            <button
              onClick={openSearch}
              aria-label="Search"
              className="tf-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink sm:hidden"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <div className="ml-auto flex items-center gap-1">
              <NotificationBell />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </ActiveOrgProvider>
  );
}

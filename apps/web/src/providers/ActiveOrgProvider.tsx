"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

export interface NavWorkspace {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}
export interface NavOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
  workspaces: NavWorkspace[];
}

interface ActiveOrgContextValue {
  orgs: NavOrg[];
  activeOrg: NavOrg | null;
  setActiveOrgId: (id: string) => void;
}

const ActiveOrgContext = React.createContext<ActiveOrgContextValue | null>(null);

export function ActiveOrgProvider({ orgs, initialOrgSlug, children }: { orgs: NavOrg[]; initialOrgSlug?: string; children: React.ReactNode }) {
  const pathname = usePathname();

  const [activeOrgId, setActiveOrgIdState] = React.useState<string | null>(() => {
    const bySlug = initialOrgSlug ? orgs.find((o) => o.slug === initialOrgSlug) : undefined;
    return bySlug?.id ?? orgs[0]?.id ?? null;
  });

  // Whenever the URL is scoped to a specific org (e.g. /orgs/acme/members),
  // that takes priority over whatever was last remembered.
  React.useEffect(() => {
    const match = pathname?.match(/^\/orgs\/([^/]+)/);
    if (!match) return;
    const bySlug = orgs.find((o) => o.slug === match[1]);
    if (bySlug) setActiveOrgIdState(bySlug.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  React.useEffect(() => {
    if (!activeOrgId) return;
    try {
      localStorage.setItem("tf-active-org", activeOrgId);
    } catch {
      // ignore
    }
  }, [activeOrgId]);

  React.useEffect(() => {
    if (pathname?.startsWith("/orgs/")) return;
    try {
      const saved = localStorage.getItem("tf-active-org");
      if (saved && orgs.some((o) => o.id === saved)) setActiveOrgIdState(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0] ?? null;

  return (
    <ActiveOrgContext.Provider value={{ orgs, activeOrg, setActiveOrgId: setActiveOrgIdState }}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg() {
  const ctx = React.useContext(ActiveOrgContext);
  if (!ctx) throw new Error("useActiveOrg must be used within ActiveOrgProvider");
  return ctx;
}

"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/providers/SessionProvider";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [invitation, setInvitation] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [accepting, setAccepting] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInvitation(data.invitation);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function accept() {
    setAccepting(true);
    const res = await fetch(`/api/invitations/${token}`, { method: "POST" });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push(`/orgs/${data.orgSlug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-panel">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-muted text-accent">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {error && <p className="mt-6 text-sm text-danger">{error}</p>}
        {!error && !invitation && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
          </div>
        )}
        {!error && invitation && (
          <>
            <h1 className="mt-5 font-display text-lg font-semibold text-ink">Join {invitation.org.name}</h1>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              {invitation.invitedBy.name} invited <span className="font-medium text-ink">{invitation.email}</span> to
              join as {invitation.role.toLowerCase()}.
            </p>
            <div className="mt-7">
              {sessionLoading ? null : user ? (
                <Button className="w-full" size="lg" onClick={accept} disabled={accepting}>
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept invitation"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Link href={`/signup?email=${encodeURIComponent(invitation.email)}`}>
                    <Button className="w-full" size="lg">
                      Create an account to accept
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" className="w-full" size="lg">
                      I already have an account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

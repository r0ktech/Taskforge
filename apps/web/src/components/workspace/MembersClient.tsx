"use client";
import * as React from "react";
import { Plus, Mail } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { can, type Role } from "@taskforge/shared";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl: string | null;
  title: string | null;
  role: Role;
}
interface Invitation {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  invitedBy: { name: string };
}

export function MembersClient({
  orgId,
  myRole,
  initialMembers,
  initialInvitations,
}: {
  orgId: string;
  myRole: Role;
  initialMembers: Member[];
  initialInvitations: Invitation[];
}) {
  const [members] = React.useState(initialMembers);
  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const canInvite = can(myRole, "invitation.send");

  async function refreshInvitations() {
    const res = await fetch(`/api/orgs/${orgId}/invitations`);
    if (res.ok) setInvitations((await res.json()).invitations);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">Members</h1>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4" /> Invite
          </Button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[420px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Member</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="flex items-center gap-2.5 px-4 py-3">
                  <Avatar name={m.name} color={m.avatarColor} src={m.avatarUrl} size="sm" />
                  <div>
                    <p className="font-medium text-ink">{m.name}</p>
                    <p className="text-[12px] text-ink-faint">{m.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge variant="neutral">{m.role}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invitations.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-[14px] font-semibold text-ink">Pending invitations</h2>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center gap-2.5 px-4 py-3 text-[13px]">
                <Mail className="h-4 w-4 text-ink-faint" />
                <span className="flex-1 text-ink">{inv.email}</span>
                <Badge variant="accent">{inv.role}</Badge>
                <span className="text-[11px] text-ink-faint">invited by {inv.invitedBy.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <InviteMemberDialog orgId={orgId} open={inviteOpen} onOpenChange={setInviteOpen} onInvited={refreshInvitations} />
    </div>
  );
}

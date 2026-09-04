"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

export function InviteMemberDialog({ orgId, open, onOpenChange, onInvited }: { orgId: string; open: boolean; onOpenChange: (o: boolean) => void; onInvited?: () => void }) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("MEMBER");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/orgs/${orgId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not send invitation");
      return;
    }
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
    onOpenChange(false);
    onInvited?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Invite a teammate</DialogTitle>
        <DialogDescription>They'll receive an email with a link to join.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>Send invitation</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

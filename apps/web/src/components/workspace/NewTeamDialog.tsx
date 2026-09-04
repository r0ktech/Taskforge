"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewTeamDialog({ workspaceId, open, onOpenChange }: { workspaceId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/teams`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create team");
      return;
    }
    onOpenChange(false);
    setName("");
    setDescription("");
    toast.success(`${data.team.name} created`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New team</DialogTitle>
        <DialogDescription>Teams group people who work together within a workspace.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Name</Label>
            <Input id="team-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Core Platform" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description (optional)</Label>
            <Textarea id="team-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>Create team</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

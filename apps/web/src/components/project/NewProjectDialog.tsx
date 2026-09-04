"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

export function NewProjectDialog({
  workspaceId,
  teams,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  teams: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [teamId, setTeamId] = React.useState<string>("none");
  const [loading, setLoading] = React.useState(false);

  function onNameChange(v: string) {
    setName(v);
    if (!key || key === deriveKey(name)) setKey(deriveKey(v));
  }

  function deriveKey(v: string) {
    return v
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        key: key.toUpperCase(),
        description: description || undefined,
        teamId: teamId === "none" ? undefined : teamId,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create project");
      return;
    }
    onOpenChange(false);
    toast.success(`${data.project.name} created`);
    router.push(`/workspaces/${workspaceId}/projects/${data.project.id}/board`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New project</DialogTitle>
        <DialogDescription>Every project starts with a Kanban board already set up.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name</Label>
            <Input id="proj-name" required autoFocus value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Engineering Roadmap" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-key">Key</Label>
            <Input
              id="proj-key"
              required
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ENG"
              className="font-mono uppercase"
            />
            <p className="text-[11px] text-ink-faint">Tasks will be numbered {key || "ENG"}-1, {key || "ENG"}-2, ...</p>
          </div>
          {teams.length > 0 && (
            <div className="space-y-1.5">
              <Label>Team (optional)</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description (optional)</Label>
            <Textarea id="proj-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>Create project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

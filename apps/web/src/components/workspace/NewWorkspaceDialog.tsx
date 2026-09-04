"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const COLORS = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

export function NewWorkspaceDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/orgs/${orgId}/workspaces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, color }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create workspace");
      return;
    }
    onOpenChange(false);
    setName("");
    setDescription("");
    toast.success(`${data.workspace.name} created`);
    router.push(`/workspaces/${data.workspace.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New workspace</DialogTitle>
        <DialogDescription>Workspaces group teams and projects under your organization.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Name</Label>
            <Input id="ws-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Product" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-desc">Description (optional)</Label>
            <Textarea id="ws-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this workspace is for" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition-shadow"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Create workspace
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

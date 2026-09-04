"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const COLORS = ["#94A3B8", "#6366F1", "#0EA5E9", "#F59E0B", "#10B981", "#EF4444"];

export function NewColumnDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (column: any) => void;
}) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [wipLimit, setWipLimit] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/columns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, color, wipLimit: wipLimit ? Number(wipLimit) : undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create column");
      return;
    }
    onCreated({ ...data.column, tasks: [] });
    onOpenChange(false);
    setName("");
    setWipLimit("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New column</DialogTitle>
        <DialogDescription>Add a stage to this board.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input id="col-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Blocked" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-wip">WIP limit (optional)</Label>
            <Input id="col-wip" type="number" min={1} value={wipLimit} onChange={(e) => setWipLimit(e.target.value)} placeholder="e.g. 5" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>Add column</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

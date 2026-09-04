"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import type { BoardUser, BoardColumn } from "./types";

export function NewTaskDialog({
  open,
  onOpenChange,
  projectId,
  columns,
  defaultColumnId,
  members,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  columns: BoardColumn[];
  defaultColumnId: string | null;
  members: BoardUser[];
  onCreated: (task: any) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [columnId, setColumnId] = React.useState(defaultColumnId ?? columns[0]?.id ?? "");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [assigneeId, setAssigneeId] = React.useState<string>("none");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setColumnId(defaultColumnId ?? columns[0]?.id ?? "");
  }, [open, defaultColumnId, columns]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        columnId,
        priority,
        assigneeIds: assigneeId === "none" ? [] : [assigneeId],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create task");
      return;
    }
    onCreated(data.task);
    onOpenChange(false);
    setTitle("");
    setDescription("");
    setAssigneeId("none");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New task</DialogTitle>
        <DialogDescription>Add a card to the board.</DialogDescription>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fix drag-and-drop jump on fast reorder" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea id="task-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Column</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2"><Avatar name={m.name} color={m.avatarColor} size="xs" /> {m.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !columnId}>Create task</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

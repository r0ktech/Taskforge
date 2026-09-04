"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { X, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { CommentThread } from "./CommentThread";
import { PRIORITY_META } from "@/lib/priority";
import { can, type Role } from "@taskforge/shared";
import type { BoardUser, BoardLabel } from "./types";

interface TaskDetail {
  id: string;
  number: number;
  ref: string;
  title: string;
  description: string | null;
  priority: keyof typeof PRIORITY_META;
  dueDate: string | null;
  createdBy: { name: string };
  assignees: { user: BoardUser }[];
  labels: { label: BoardLabel }[];
  attachments: { id: string; fileName: string; fileUrl: string; fileSize: number }[];
  comments: { id: string; body: string; createdAt: string; author: BoardUser }[];
}

export function TaskDetailPanel({
  taskId,
  projectKey,
  members,
  labels,
  myRole,
  onClose,
  onChanged,
  onDeleted,
}: {
  taskId: string;
  projectKey: string;
  members: BoardUser[];
  labels: BoardLabel[];
  myRole: Role;
  onClose: () => void;
  onChanged: (task: any) => void;
  onDeleted: (taskId: string) => void;
}) {
  const [task, setTask] = React.useState<TaskDetail | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const canEdit = can(myRole, "task.update");
  const canDelete = can(myRole, "task.delete");

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    if (!res.ok) return;
    const data = await res.json();
    setTask(data.task);
    setTitle(data.task.title);
    setDescription(data.task.description ?? "");
  }, [taskId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Update failed");
      return;
    }
    onChanged(data.task);
    void load();
  }

  async function deleteTask() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete task");
      return;
    }
    onDeleted(taskId);
    onClose();
  }

  function toggleAssignee(userId: string) {
    if (!task) return;
    const current = task.assignees.map((a) => a.user.id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    void patch({ assigneeIds: next });
  }

  function toggleLabel(labelId: string) {
    if (!task) return;
    const current = task.labels.map((l) => l.label.id);
    const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
    void patch({ labelIds: next });
  }

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: form });
    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    void load();
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[1px] animate-fade-in" />
        <DialogPrimitive.Content className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border bg-surface shadow-panel animate-slide-in-right focus:outline-none sm:max-w-xl">
          {!task ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <span className="font-mono text-[12px] font-medium text-ink-faint">{task.ref}</span>
                <div className="flex items-center gap-1">
                  {canDelete && (
                    <button onClick={deleteTask} className="tf-focus-ring rounded p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <DialogPrimitive.Close className="tf-focus-ring rounded p-1.5 text-ink-faint hover:bg-surface-raised hover:text-ink">
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <DialogPrimitive.Title asChild>
                  <textarea
                    value={title}
                    disabled={!canEdit}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => title !== task.title && patch({ title })}
                    rows={1}
                    className="w-full resize-none border-none bg-transparent font-display text-lg font-semibold text-ink outline-none"
                  />
                </DialogPrimitive.Title>

                <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface-raised p-4 text-[13px] sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Priority</p>
                    <Select value={task.priority} onValueChange={(v) => patch({ priority: v })} disabled={!canEdit}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_META).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Due date</p>
                    <input
                      type="date"
                      disabled={!canEdit}
                      defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                      onChange={(e) => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="tf-focus-ring h-8 w-full rounded-md border border-border-strong bg-surface px-2 text-[13px] text-ink"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Assignees</p>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((m) => {
                        const active = task.assignees.some((a) => a.user.id === m.id);
                        return (
                          <button
                            key={m.id}
                            disabled={!canEdit}
                            onClick={() => toggleAssignee(m.id)}
                            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] transition-colors ${
                              active ? "border-accent bg-accent-muted text-accent" : "border-border text-ink-muted hover:border-ink-faint"
                            }`}
                          >
                            <Avatar name={m.name} color={m.avatarColor} src={m.avatarUrl} size="xs" />
                            {m.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {labels.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {labels.map((l) => {
                          const active = task.labels.some((tl) => tl.label.id === l.id);
                          return (
                            <button
                              key={l.id}
                              disabled={!canEdit}
                              onClick={() => toggleLabel(l.id)}
                              className="rounded-full px-2 py-1 text-[12px] font-medium transition-opacity"
                              style={{
                                backgroundColor: `${l.color}${active ? "33" : "14"}`,
                                color: l.color,
                                opacity: active ? 1 : 0.6,
                              }}
                            >
                              {l.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Description</p>
                  <Textarea
                    value={description}
                    disabled={!canEdit}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => description !== (task.description ?? "") && patch({ description })}
                    rows={4}
                    placeholder="Add a description..."
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Attachments</p>
                    <label className="tf-focus-ring flex cursor-pointer items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                      <Upload className="h-3 w-3" /> Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadFile(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {task.attachments.length === 0 ? (
                    <p className="text-[12px] text-ink-faint">No files attached.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {task.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] text-ink hover:bg-surface-raised"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-ink-faint" />
                          <span className="truncate">{a.fileName}</span>
                          <span className="ml-auto text-[11px] text-ink-faint">{(a.fileSize / 1024).toFixed(0)} KB</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                    Comments · {task.comments.length}
                  </p>
                  <CommentThread
                    taskId={task.id}
                    members={members}
                    comments={task.comments}
                    onCommentAdded={(c) => setTask((t) => (t ? { ...t, comments: [...t.comments, c] } : t))}
                  />
                </div>

                <p className="mt-6 text-[11px] text-ink-faint">Created by {task.createdBy.name}</p>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

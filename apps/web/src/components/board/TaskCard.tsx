"use client";
import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Paperclip, CalendarClock } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { PRIORITY_META } from "@/lib/priority";
import { cn } from "@/lib/cn";
import type { BoardTask } from "./types";

export function TaskCard({
  task,
  projectKey,
  onClick,
}: {
  task: BoardTask;
  projectKey: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const meta = PRIORITY_META[task.priority];
  const overdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border border-border bg-surface p-3 shadow-subtle transition-shadow hover:shadow-card",
        isDragging && "rotate-1"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium text-ink-faint">{projectKey}-{task.number}</span>
        {task.priority !== "MEDIUM" && (
          <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: meta.dot }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
            {meta.label}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-ink">{task.title}</p>

      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}1F`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[11px] text-ink-faint">
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task._count.comments}</span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{task._count.attachments}</span>
          )}
          {task.dueDate && (
            <span className={cn("flex items-center gap-1", overdue && "text-danger")}>
              <CalendarClock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        {task.assignees.length > 0 && <AvatarStack people={task.assignees.map((a) => a.user)} max={3} />}
      </div>
    </div>
  );
}

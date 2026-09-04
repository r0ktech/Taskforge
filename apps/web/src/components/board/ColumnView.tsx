"use client";
import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/cn";
import type { BoardColumn } from "./types";

export function ColumnView({
  column,
  projectKey,
  onTaskClick,
  onAddTask,
}: {
  column: BoardColumn;
  projectKey: string;
  onTaskClick: (id: string) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column", column } });
  const atLimit = !!column.wipLimit && column.tasks.length >= column.wipLimit;

  return (
    <div className="flex w-[82vw] max-w-[300px] shrink-0 flex-col sm:w-[300px]">
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="text-[13px] font-semibold text-ink">{column.name}</span>
        <span className={cn("rounded-full px-1.5 text-[11px]", atLimit ? "bg-danger/10 text-danger" : "text-ink-faint")}>
          {column.tasks.length}
          {column.wipLimit ? ` / ${column.wipLimit}` : ""}
        </span>
        <button onClick={onAddTask} className="tf-focus-ring ml-auto rounded p-1 text-ink-faint hover:bg-surface-raised hover:text-ink">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button className="tf-focus-ring rounded p-1 text-ink-faint hover:bg-surface-raised hover:text-ink">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg border border-transparent bg-canvas/60 p-1.5 transition-colors",
          isOver && "border-accent/40 bg-accent-muted/40"
        )}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectKey={projectKey} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
        <button
          onClick={onAddTask}
          className="tf-focus-ring flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] text-ink-faint hover:bg-surface-raised hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" /> Add task
        </button>
      </div>
    </div>
  );
}

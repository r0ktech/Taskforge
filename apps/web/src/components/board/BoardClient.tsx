"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ColumnView } from "./ColumnView";
import { TaskCard } from "./TaskCard";
import { NewTaskDialog } from "./NewTaskDialog";
import { NewColumnDialog } from "./NewColumnDialog";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSocketRoom } from "@/hooks/useSocketRoom";
import { orderBetween } from "@/lib/order";
import { can, type Role } from "@taskforge/shared";
import type { ProjectData, BoardColumn as BoardColumnType, BoardTask } from "./types";

export function BoardClient({
  project,
  myRole,
  currentUserId,
  workspaceId,
}: {
  project: ProjectData;
  myRole: Role;
  currentUserId: string;
  workspaceId: string;
}) {
  const board = project.boards[0];
  const [columns, setColumns] = React.useState<BoardColumnType[]>(board?.columns ?? []);
  const [activeTask, setActiveTask] = React.useState<BoardTask | null>(null);
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = React.useState<string | null>(null);
  const [newColumnOpen, setNewColumnOpen] = React.useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const openTaskId = searchParams.get("task");

  const members = project.members.map((m) => m.user);
  // Mouse drags start after a few pixels. Touch drags need a short press-and-hold
  // instead — otherwise every attempt to scroll the board would pick up a card.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const columnsRef = React.useRef(columns);
  columnsRef.current = columns;

  function findTask(taskId: string) {
    for (const col of columnsRef.current) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) return { task, column: col };
    }
    return null;
  }

  function upsertTaskFromServer(updated: Partial<BoardTask> & { id: string; columnId?: string }) {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      }))
    );
  }

  // ---------------------------------------------------------------------
  // Realtime sync — every mutation from any client (including this one,
  // harmlessly) arrives here and keeps the board consistent for everyone.
  // ---------------------------------------------------------------------
  useSocketRoom(board ? `board:${board.id}` : null, {
    "task.moved": (payload: any) => {
      setColumns((cols) => {
        let moved: BoardTask | undefined;
        const stripped = cols.map((c) => {
          const found = c.tasks.find((t) => t.id === payload.taskId);
          if (found) moved = found;
          return { ...c, tasks: c.tasks.filter((t) => t.id !== payload.taskId) };
        });
        if (!moved) return cols;
        const updatedTask = { ...moved, columnId: payload.toColumnId, order: payload.order };
        return stripped.map((c) =>
          c.id === payload.toColumnId
            ? { ...c, tasks: [...c.tasks, updatedTask].sort((a, b) => a.order - b.order) }
            : c
        );
      });
    },
    "task.created": async () => {
      router.refresh();
    },
    "task.updated": (payload: any) => {
      if (payload.fields?.assigneeIds || payload.fields?.labelIds) {
        // Assignee/label changes need the related rows re-fetched; a full
        // refresh keeps this simple and correct.
        router.refresh();
      }
    },
    "task.deleted": (payload: any) => {
      setColumns((cols) => cols.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== payload.taskId) })));
    },
    "column.created": () => router.refresh(),
    "column.updated": () => router.refresh(),
  });

  function handleDragStart(e: DragStartEvent) {
    const found = findTask(e.active.id as string);
    setActiveTask(found?.task ?? null);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const activeId = e.active.id as string;
    setActiveTask(null);
    if (!e.over) return;

    const found = findTask(activeId);
    if (!found) return;
    const { task: draggedTask, column: fromColumn } = found;

    const overId = e.over.id as string;
    const overIsColumn = columnsRef.current.some((c) => c.id === overId);
    const toColumn = overIsColumn ? columnsRef.current.find((c) => c.id === overId)! : findTask(overId)?.column;
    if (!toColumn) return;

    if (toColumn.wipLimit && toColumn.id !== fromColumn.id && toColumn.tasks.length >= toColumn.wipLimit) {
      toast.error(`"${toColumn.name}" is at its WIP limit of ${toColumn.wipLimit}`);
      return;
    }

    const destTasks = toColumn.tasks.filter((t) => t.id !== activeId);
    const overIndex = overIsColumn ? destTasks.length : destTasks.findIndex((t) => t.id === overId);
    const before = destTasks[overIndex - 1]?.order;
    const after = destTasks[overIndex]?.order;
    const newOrder = orderBetween(before, after);

    setColumns((cols) =>
      cols.map((c) => {
        if (c.id === fromColumn.id && c.id !== toColumn.id) {
          return { ...c, tasks: c.tasks.filter((t) => t.id !== activeId) };
        }
        if (c.id === toColumn.id) {
          const others = c.tasks.filter((t) => t.id !== activeId);
          const next = [...others];
          next.splice(overIndex, 0, { ...draggedTask, columnId: toColumn.id, order: newOrder });
          return { ...c, tasks: next };
        }
        return c;
      })
    );

    const res = await fetch(`/api/tasks/${activeId}/move`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ columnId: toColumn.id, order: newOrder }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not move task");
      router.refresh();
    }
  }

  function handleTaskCreated(task: BoardTask) {
    setColumns((cols) => cols.map((c) => (c.id === task.columnId ? { ...c, tasks: [...c.tasks, task] } : c)));
    toast.success(`${project.key}-${task.number} created`);
  }

  function handleColumnCreated(column: BoardColumnType) {
    setColumns((cols) => [...cols, column]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: `${project.color}22` }}
          >
            <span className="text-[10px] font-bold" style={{ color: project.color }}>
              {project.key[0]}
            </span>
          </div>
          <h1 className="truncate font-display text-[15px] font-semibold text-ink sm:text-[16px]">{project.name}</h1>
          <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">{project.key}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <AvatarStack people={members} max={5} />
          </div>
          <Link href={`/workspaces/${workspaceId}/projects/${project.id}/analytics`} aria-label="Analytics">
            <Button variant="secondary" size="sm" className="px-2 sm:px-2.5">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          </Link>
          {can(myRole, "board.manageColumns") && (
            <Button variant="secondary" size="sm" className="px-2 sm:px-2.5" onClick={() => setNewColumnOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Column</span>
            </Button>
          )}
          {can(myRole, "task.create") && (
            <Button
              size="sm"
              onClick={() => {
                setNewTaskColumnId(columns[0]?.id ?? null);
                setNewTaskOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">Task</span>
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-3 sm:gap-4">
            {columns.map((col) => (
              <ColumnView
                key={col.id}
                column={col}
                projectKey={project.key}
                onTaskClick={(id) => router.push(`?task=${id}`, { scroll: false })}
                onAddTask={() => {
                  setNewTaskColumnId(col.id);
                  setNewTaskOpen(true);
                }}
              />
            ))}
            {columns.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-[13px] text-ink-faint">
                No columns yet.
              </div>
            )}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} projectKey={project.key} onClick={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        projectId={project.id}
        columns={columns}
        defaultColumnId={newTaskColumnId}
        members={members}
        onCreated={handleTaskCreated}
      />
      <NewColumnDialog projectId={project.id} open={newColumnOpen} onOpenChange={setNewColumnOpen} onCreated={handleColumnCreated} />

      {openTaskId && (
        <TaskDetailPanel
          taskId={openTaskId}
          projectKey={project.key}
          members={members}
          labels={project.labels}
          myRole={myRole}
          onClose={() => router.push(`/workspaces/${workspaceId}/projects/${project.id}/board`, { scroll: false })}
          onChanged={upsertTaskFromServer}
          onDeleted={(id) => setColumns((cols) => cols.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== id) })))}
        />
      )}
    </div>
  );
}

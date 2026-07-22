"use client";
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useTasksUIStore } from "../store/tasks-ui-store";
import { useTaskList, type TaskItem } from "../hooks/use-tasks";
import { api } from "@/lib/api-client";

const COLUMNS: { key: TaskItem["status"]; label: string; color: string }[] = [
  { key: "todo",        label: "Todo",        color: "border-blue-500"   },
  { key: "in_progress", label: "In Progress", color: "border-yellow-500" },
  { key: "review",      label: "Review",      color: "border-purple-500" },
  { key: "done",        label: "Done",        color: "border-green-500"  },
];

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-500",
  medium: "bg-yellow-400",
  low:    "bg-emerald-500",
};

function TaskCard({
  task, index,
}: {
  task: TaskItem;
  index: number;
}) {
  const { openDetail, openEdit } = useTasksUIStore();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card p-3 text-sm cursor-grab active:cursor-grabbing select-none ${snapshot.isDragging ? "shadow-xl rotate-1 opacity-90" : "hover:shadow-md"} transition-shadow`}
          role="article"
          aria-label={task.title}
        >
          <div className="flex items-start gap-2 mb-2">
            <span
              className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
              aria-label={`Priority: ${task.priority}`}
            />
            <p className="flex-1 font-medium line-clamp-2 leading-tight">{task.title}</p>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between gap-1 mt-1">
            <div className="flex items-center gap-1">
              {task.assignee && (
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold"
                  title={task.assignee.name}>
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              )}
              {task.dueDate && (
                <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  🕓 {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {task._count.comments > 0 && (
                <span className="text-xs text-muted-foreground">💬{task._count.comments}</span>
              )}
              <button type="button"
                className="button button--xs button--ghost button--primary"
                onClick={(e) => { e.stopPropagation(); openDetail(task.id); }}
                aria-label={`Open ${task.title}`}>
                ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function TaskKanban({ mine }: { mine: boolean }) {
  const { filterPriority, filterSearch } = useTasksUIStore();
  const qc = useQueryClient();
  const { data, isLoading } = useTaskList({
    mine,
    priority: filterPriority === "all" ? undefined : filterPriority,
    search:   filterSearch || undefined,
    page: 1,
  });

  // Group by status
  const allTasks = data?.data ?? [];
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = allTasks.filter((t) => t.status === col.key);
    return acc;
  }, {} as Record<string, TaskItem[]>);

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const taskId    = result.draggableId;
    const newStatus = result.destination.droppableId as TaskItem["status"];

    // Optimistic update — mutate cache immediately, then sync with server
    qc.setQueriesData<import("@tanstack/react-query").InfiniteData<unknown> | { data: TaskItem[] }>(
      { queryKey: ["tasks", "list"] },
      (old) => {
        if (!old || !("data" in old)) return old;
        return { ...old, data: (old as { data: TaskItem[] }).data.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ) };
      }
    );

    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
    } finally {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col gap-2">
            <div className="h-6 bg-muted rounded w-24" />
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const tasks = byStatus[col.key] ?? [];
          return (
            <div key={col.key} className={`flex flex-col border-t-2 ${col.color} pt-3`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{col.label}</p>
                <span className="badge badge--neutral badge--sm">{tasks.length}</span>
              </div>

              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-2 min-h-24 rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                  >
                    {tasks.map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}

                    {tasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

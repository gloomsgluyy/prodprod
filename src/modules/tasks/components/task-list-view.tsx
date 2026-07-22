"use client";

import { useTasksUIStore } from "../store/tasks-ui-store";
import { useTaskList, useUpdateTaskStatus, type TaskItem } from "../hooks/use-tasks";

const STATUS_BADGE: Record<string, string> = {
  todo:"badge--neutral", in_progress:"badge--primary", review:"badge--warning", done:"badge--success",
};
const PRIORITY_DOT: Record<string, string> = {
  urgent:"bg-red-500", high:"bg-orange-500", medium:"bg-yellow-400", low:"bg-emerald-500",
};

export function TaskListView({ mine }: { mine: boolean }) {
  const { filterPriority, filterSearch, page, setPage, openDetail } = useTasksUIStore();
  const { data, isLoading } = useTaskList({
    mine,
    priority: filterPriority === "all" ? undefined : filterPriority,
    search:   filterSearch   || undefined,
    page,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="Tasks table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Linked</th>
                    <th>Comments</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted-foreground py-8">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    items.map((task: TaskItem) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                      return (
                        <tr key={task.id} className="cursor-pointer hover:bg-surface"
                          onClick={() => openDetail(task.id)}>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                              <span className="text-xs capitalize">{task.priority}</span>
                            </div>
                          </td>
                          <td className="font-medium max-w-xs truncate">{task.title}</td>
                          <td>
                            <StatusDropdown task={task} />
                          </td>
                          <td className="text-xs">
                            {task.assignee ? (
                              <div className="flex items-center gap-1">
                                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">
                                  {task.assignee.name.charAt(0)}
                                </span>
                                {task.assignee.name}
                              </div>
                            ) : "—"}
                          </td>
                          <td className={`text-xs ${isOverdue ? "text-red-500 font-medium" : ""}`}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="text-xs text-muted-foreground capitalize">
                            {task.relatedModule ?? "—"}
                          </td>
                          <td className="text-xs text-muted-foreground">
                            {task._count.comments > 0 ? `💬 ${task._count.comments}` : "—"}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button type="button"
                              className="button button--xs button--ghost button--primary"
                              onClick={() => openDetail(task.id)}
                              aria-label={`Open ${task.title}`}>
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {meta.total} tasks · Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}>←</button>
                  <button type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage(meta.page + 1)}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusDropdown({ task }: { task: TaskItem }) {
  const { mutate } = useUpdateTaskStatus(task.id);

  return (
    <select
      className={`select select--sm ${STATUS_BADGE[task.status] ?? ""}`}
      value={task.status}
      onChange={(e) => mutate(e.target.value as TaskItem["status"])}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Status for ${task.title}`}
    >
      {["todo","in_progress","review","done"].map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
        </option>
      ))}
    </select>
  );
}

"use client";

import Link from "next/link";
import { usePriorityTasks } from "../hooks/use-dashboard";
import type { TaskItem } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-500",
  medium: "bg-yellow-400",
  low:    "bg-emerald-500",
};

const STATUS_BADGE: Record<string, string> = {
  todo:        "badge--neutral",
  in_progress: "badge--primary",
  review:      "badge--warning",
  done:        "badge--success",
};

export function PriorityTasks() {
  const { data, isLoading } = usePriorityTasks();
  const tasks: TaskItem[] = data?.data ?? [];

  return (
    <div className="card h-full">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Priority Tasks</p>
          <Link href="/all-tasks" className="link text-xs">View All →</Link>
        </div>

        {isLoading ? (
          <TasksSkeleton />
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] ?? "bg-gray-400"}`}
                  aria-label={`Priority: ${task.priority}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.assignee?.name ?? "Unassigned"}
                    {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`badge badge--sm ${STATUS_BADGE[task.status] ?? ""}`}>
                  {task.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-2 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-muted rounded w-3/4 mb-1" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

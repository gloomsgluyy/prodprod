"use client";

import { useState } from "react";
import { useTasksUIStore } from "../store/tasks-ui-store";
import { useTaskList, useTaskComments, useAddComment, useDeleteTask, type TaskItem } from "../hooks/use-tasks";

const PRIORITY_DOT: Record<string, string> = {
  urgent:"bg-red-500", high:"bg-orange-500", medium:"bg-yellow-400", low:"bg-emerald-500",
};
const STATUS_BADGE: Record<string, string> = {
  todo:"badge--neutral", in_progress:"badge--primary", review:"badge--warning", done:"badge--success",
};

export function TaskDetailDialog({ mine }: { mine: boolean }) {
  const { detailId, closeDetail, openEdit } = useTasksUIStore();
  const { data }     = useTaskList({ mine, page: 1 });
  const task         = data?.data?.find((t: TaskItem) => t.id === detailId);
  const { data: commentsData } = useTaskComments(detailId ?? "");
  const { mutate: addComment, isPending: adding } = useAddComment(detailId ?? "");
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask(detailId ?? "");
  const [commentText, setCommentText] = useState("");

  if (!detailId || !task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Task: ${task!.title}\nPriority: ${task!.priority}\nDue: ${task!.dueDate ?? "No due date"}\n\nCoalTrade OS`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(commentText.trim(), { onSuccess: () => setCommentText("") });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={task.title}
    >
      <div className="card w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="card__body pb-0 gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                aria-label={`Priority: ${task.priority}`} />
              <h2 className="font-semibold text-base leading-tight">{task.title}</h2>
            </div>
            <button type="button"
              className="button button--ghost button--neutral button--icon-only flex-shrink-0"
              onClick={closeDetail} aria-label="Close">✕</button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className={`badge badge--sm ${STATUS_BADGE[task.status]}`}>
              {task.status.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
            </span>
            <span className="badge badge--neutral badge--sm capitalize">{task.priority}</span>
            {isOverdue && <span className="badge badge--danger badge--sm">Overdue</span>}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto card__body gap-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-eyebrow">Assignee</p>
              <p>{task.assignee?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-eyebrow">Due Date</p>
              <p className={isOverdue ? "text-red-500 font-medium" : ""}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-eyebrow">Created by</p>
              <p>{task.createdBy.name}</p>
            </div>
            {task.relatedModule && (
              <div>
                <p className="text-eyebrow">Linked to</p>
                <p className="capitalize">{task.relatedModule}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-eyebrow mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{task.description}</p>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-eyebrow mb-2">Comments ({commentsData?.data?.length ?? 0})</p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-2">
              {(commentsData?.data ?? []).map((c) => (
                <div key={c.id} className="p-2 rounded-lg bg-surface border border-border text-xs">
                  <p className="font-medium mb-0.5 text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input type="text" className="input flex-1 text-sm" placeholder="Add a comment…"
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                aria-label="Comment text" />
              <button type="submit" className="button button--sm button--primary"
                disabled={adding || !commentText.trim()} aria-busy={adding}>
                {adding ? "…" : "Send"}
              </button>
            </form>
          </div>
        </div>

        {/* Actions footer */}
        <div className="card__body pt-0 flex flex-wrap gap-2 border-t border-border">
          <button type="button" className="button button--sm button--ghost button--primary"
            onClick={() => { closeDetail(); openEdit(task.id); }}>Edit</button>
          <button type="button" className="button button--sm button--ghost button--neutral"
            onClick={handleWhatsApp}>Open in WhatsApp</button>
          <button type="button" className="button button--sm button--ghost button--danger ms-auto"
            disabled={deleting} aria-busy={deleting}
            onClick={() => { if (confirm("Delete task?")) deleteTask(undefined, { onSuccess: closeDetail }); }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

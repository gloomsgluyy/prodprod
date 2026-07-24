"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useTasksUIStore } from "../store/tasks-ui-store";
import { useCreateTask, useUpdateTask, useTaskList } from "../hooks/use-tasks";

const schema = z.object({
  title:       z.string().min(1, "Required"),
  description: z.string().optional(),
  priority:    z.enum(["low","medium","high","urgent"]).default("medium"),
  status:      z.enum(["todo","in_progress","review","done"]).default("todo"),
  assigneeId:  z.string().optional(),
  dueDate:     z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function TaskFormModal({ mine }: { mine: boolean }) {
  const { createModalOpen, editingId, closeCreateEdit } = useTasksUIStore();
  const isEdit = !!editingId;

  const { data } = useTaskList({ mine });
  const editing = isEdit ? data?.data?.find((t) => t.id === editingId) : undefined;

  const { data: usersData } = useQuery({
    queryKey: ["users", "options"],
    queryFn: () => api.get<{ data: Array<{ id: string; name: string; role: string }> }>("/api/users?pageSize=100"),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: create, isPending: creating } = useCreateTask();
  const { mutate: update, isPending: updating } = useUpdateTask(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", status: "todo" },
  });

  useEffect(() => {
    if (editing && isEdit) {
      reset({
        title:       editing.title,
        description: editing.description ?? "",
        priority:    editing.priority,
        status:      editing.status,
        assigneeId:  editing.assignee?.id ?? "",
        dueDate:     editing.dueDate?.split("T")[0] ?? "",
      });
    }
  }, [editing, isEdit, reset]);

  function onSubmit(d: FormValues) {
    const payload = { ...d, assigneeId: d.assigneeId || undefined };
    if (isEdit) update(payload, { onSuccess: closeCreateEdit });
    else        create(payload, { onSuccess: closeCreateEdit });
  }

  if (!createModalOpen && !isEdit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={isEdit ? "Edit Task" : "New Task"}>
      <div className="card w-full max-w-md">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Task" : "New Task"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCreateEdit} aria-label="Close">✕</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="task-title">Title *</label>
              <input id="task-title" type="text" className={`input ${errors.title?"input--invalid":""}`}
                placeholder="Task description" {...register("title")} />
              {errors.title && <p className="text-xs text-danger mt-0.5">{errors.title.message}</p>}
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="task-desc">Description</label>
              <textarea id="task-desc" className="input" rows={2}
                placeholder="More details…" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="select" {...register("priority")}>
                  {["urgent","high","medium","low"].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="task-status">Status</label>
                <select id="task-status" className="select" {...register("status")}>
                  {["todo","in_progress","review","done"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="task-assignee">Assignee</label>
                <select id="task-assignee" className="select" {...register("assigneeId")}>
                  <option value="">-- Unassigned --</option>
                  {usersData?.data?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="task-due">Due Date</label>
                <input id="task-due" type="date" className="input" {...register("dueDate")} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral"
                onClick={closeCreateEdit} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary"
                disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

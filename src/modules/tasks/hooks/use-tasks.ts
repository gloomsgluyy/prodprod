import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import type { PaginatedResponse } from "@/types";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  relatedModule: string | null;
  relatedId: string | null;
  createdAt: string;
  assignee: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { comments: number };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface TaskFilters {
  page?:     number;
  status?:   string;
  priority?: string;
  mine?:     boolean;
  search?:   string;
}

const KEYS = {
  list:     (f: TaskFilters) => ["tasks", "list", f],
  comments: (id: string)     => ["tasks", "comments", id],
};

export function useTaskList(filters: TaskFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status   && filters.status   !== "all" ? { status:   filters.status   } : {}),
    ...(filters.priority && filters.priority !== "all" ? { priority: filters.priority } : {}),
    ...(filters.mine  ? { mine:   "true"          } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<TaskItem>>(`/api/tasks?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useTaskComments(id: string) {
  return useQuery({
    queryKey: KEYS.comments(id),
    queryFn: () => api.get<{ data: TaskComment[] }>(`/api/tasks/${id}/comments`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskItem>) =>
      api.post<{ data: TaskItem }>("/api/tasks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "tasks-priority"] });
      notify("Task created");
    },
    onError: () => notify("Task create failed", "error"),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskItem>) =>
      api.patch<{ data: TaskItem }>(`/api/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "tasks-priority"] });
      notify("Task updated");
    },
    onError: () => notify("Task update failed", "error"),
  });
}

export function useUpdateTaskStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TaskItem["status"]) =>
      api.patch<{ data: { id: string; status: string } }>(`/api/tasks/${id}/status`, { status }),
    // Optimistic update
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: ["tasks", "list"] });
      qc.setQueriesData<PaginatedResponse<TaskItem>>(
        { queryKey: ["tasks", "list"] },
        (old) => old
          ? { ...old, data: old.data.map((t) => t.id === id ? { ...t, status } : t) }
          : old,
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "tasks-priority"] });
    },
    onSuccess: () => notify("Task status updated"),
    onError: () => notify("Task status update failed", "error"),
  });
}

export function useDeleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); notify("Task deleted"); },
    onError: () => notify("Task delete failed", "error"),
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<{ data: TaskComment }>(`/api/tasks/${taskId}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.comments(taskId) }); notify("Comment added"); },
    onError: () => notify("Comment add failed", "error"),
  });
}

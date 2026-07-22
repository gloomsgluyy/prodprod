import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

export interface MeetingListItem {
  id: string; title: string; scheduledAt: string; location: string | null;
  participants: string[]; status: string; agenda: string | null;
  momContent: string | null; momPdfUrl: string | null; audioUrl: string | null;
  taskExtractionStatus: string | null; createdAt: string;
  createdBy: { id: string; name: string };
}

export interface MeetingDetail extends MeetingListItem {
  transcription: string | null; videoUrl: string | null;
  extractedTasks: unknown[] | null;
}

interface Filters { page?: number; status?: string; search?: string; upcoming?: boolean; }

const KEYS = {
  list:   (f: Filters) => ["meetings", "list", f],
  detail: (id: string) => ["meetings", "detail", id],
};

export function useMeetingList(filters: Filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status  && filters.status !== "all" ? { status:   filters.status  } : {}),
    ...(filters.search  ? { search:   filters.search  } : {}),
    ...(filters.upcoming ? { upcoming: "true"         } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<MeetingListItem>>(`/api/meetings?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useMeetingDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: MeetingDetail }>(`/api/meetings/${id}`),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MeetingDetail>) =>
      api.post<{ data: MeetingDetail }>("/api/meetings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "meetings-upcoming"] });
    },
  });
}

export function useUpdateMeeting(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MeetingDetail>) =>
      api.patch<{ data: MeetingDetail }>(`/api/meetings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeleteMeeting(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/meetings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useTranscribeMeeting(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (audioUrl?: string) =>
      api.post<{ data: { transcription: string } }>(`/api/meetings/${id}/transcribe`, { audioUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
  });
}

export function useExtractTasks(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { tasks: unknown[]; isStub: boolean } }>(`/api/meetings/${id}/extract-tasks`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
  });
}

export function useConfirmTasks(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tasks: unknown[]) =>
      api.patch<{ data: unknown[] }>(`/api/meetings/${id}/extract-tasks`, { tasks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import type { PaginatedResponse } from "@/types";

export interface QualityListItem {
  id: string; cargoId: string; cargoName: string; shipmentId: string | null;
  surveyor: string | null; samplingDate: string | null; status: string;
  comparisonStatus: string | null; warningNotes: string | null;
  createdAt: string; updatedAt: string;
}

export interface CoalSpec {
  gar?: number; nar?: number; tm?: number; im?: number;
  ts?: number; ash?: number; vm?: number; hgi?: number; adb?: number;
}

export interface QualityDetail extends QualityListItem {
  specResult: CoalSpec | null; contractSpec: CoalSpec | null;
  sourceEstimate: CoalSpec | null; qcResult: CoalSpec | null;
  qcDocumentId: string | null; psiResult: CoalSpec | null;
  psiDocumentId: string | null; coaPolResult: CoalSpec | null;
  coaPolDocumentId: string | null; coaPodResult: CoalSpec | null;
  coaPodDocumentId: string | null;
}

interface QCFilters { page?: number; status?: string; search?: string; shipmentId?: string; }

const KEYS = {
  list:   (f: QCFilters) => ["quality", "list", f],
  detail: (id: string)   => ["quality", "detail", id],
};

export function useQualityList(filters: QCFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status     && filters.status !== "all" ? { status:     filters.status     } : {}),
    ...(filters.search     ? { search:     filters.search     } : {}),
    ...(filters.shipmentId ? { shipmentId: filters.shipmentId } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<QualityListItem>>(`/api/quality?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useQualityDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: QualityDetail }>(`/api/quality/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QualityDetail>) =>
      api.post<{ data: QualityDetail }>("/api/quality", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quality"] }),
    onError: (error) => notify(formatApiError(error, "Quality create failed"), "error"),
  });
}

export function useUpdateQuality(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QualityDetail>) =>
      api.patch<{ data: QualityDetail }>(`/api/quality/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quality", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
    onError: (error) => notify(formatApiError(error, "Quality update failed"), "error"),
  });
}

export function useDeleteQuality(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/quality/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quality"] }),
    onError: (error) => notify(formatApiError(error, "Quality delete failed"), "error"),
  });
}

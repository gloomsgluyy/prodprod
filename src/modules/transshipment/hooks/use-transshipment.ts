import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface TransshipmentItem {
  id: string; shipmentId: string | null; mvName: string; shipmentNumber: string | null;
  vesselName: string | null; bargeName: string | null; loadingPort: string | null;
  dischargePort: string | null; freightRate: number | null; qtyLoaded: number | null;
  totalFreight: number | null; eta: string | null; status: string;
  milestones: { title: string; subtitle?: string; status: string }[] | null;
  weather: string | null; allowance: number | null; demurrage: number | null;
  despatch: number | null; pbm: number | null; pnbp: number | null;
  createdAt: string; updatedAt: string;
}

interface Summary { totalShipments: number; totalVolumeMt: number; avgFreightRate: number; }

interface Filters { page?: number; status?: string; search?: string; }

const KEYS = {
  list: (f: Filters) => ["transshipment", "list", f],
};

export function useTransshipmentList(filters: Filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<{ data: TransshipmentItem[]; meta: { total: number; page: number; pageSize: number; totalPages: number }; summary: Summary }>(`/api/transshipment?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTransshipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransshipmentItem>) =>
      api.post<{ data: TransshipmentItem }>("/api/transshipment", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transshipment"] }),
  });
}

export function useUpdateTransshipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransshipmentItem>) =>
      api.patch<{ data: TransshipmentItem }>(`/api/transshipment/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transshipment"] }),
  });
}

export function useDeleteTransshipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/transshipment/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transshipment"] }),
  });
}

export function useUpdateMilestones(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestones: TransshipmentItem["milestones"]) =>
      api.post(`/api/transshipment/${id}/milestones`, { milestones }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transshipment"] }),
  });
}

export function useRiskInsight(id: string) {
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { insights: { category: string; risk: string; detail: string; mitigation: string }[]; generatedAt: string; isStub: boolean } }>(`/api/transshipment/${id}/risk-insight`, {}),
  });
}

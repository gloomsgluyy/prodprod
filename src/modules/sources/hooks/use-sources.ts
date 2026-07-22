import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

export interface SourceItem {
  id: string; name: string; region: string | null; calorieRange: string | null;
  specGar: number|null; specTs: number|null; specAsh: number|null; specTm: number|null;
  specIm: number|null; specFc: number|null; specAdb: number|null; specNar: number|null;
  stockAvailable: number|null; minStockAlert: number|null;
  stockLocations: { location: string; quantity: number; condition?: string }[] | null;
  fobBargeOnly: boolean; requiresTransshipment: boolean;
  priceLinkedIndex: string|null; fobBargePriceUsd: number|null; fobBargePriceIdr: number|null;
  jettyPort: string|null; anchorage: string|null;
  kycStatus: string; psiStatus: string;
  iupNumber: string|null; contractType: string|null;
  contactPerson: string|null; phone: string|null; email: string|null;
  notes: string|null; isActive: boolean; createdAt: string; updatedAt: string;
}

export interface StockAlert {
  id: string; name: string; region: string|null;
  stockAvailable: number; minStockAlert: number; alertLevel: "critical"|"warning";
}

interface SourceFilters { page?: number; pageSize?: number; search?: string; region?: string; }

const KEYS = {
  list:   (f: SourceFilters) => ["sources", "list", f],
  detail: (id: string)       => ["sources", "detail", id],
  alerts: ()                 => ["sources", "alerts"],
};

export function useSourceList(filters: SourceFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.pageSize ? { pageSize: String(filters.pageSize) } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.region ? { region: filters.region } : {}),
  }).toString();
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<SourceItem>>(`/api/sources?${params}`),
    placeholderData: (p) => p,
  });
}

export function useSourceDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: SourceItem }>(`/api/sources/${id}`),
    enabled: !!id,
  });
}

export function useSourceAlerts() {
  return useQuery({
    queryKey: KEYS.alerts(),
    queryFn: () => api.get<{ data: StockAlert[] }>("/api/sources/alerts"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SourceItem>) => api.post<{ data: SourceItem }>("/api/sources", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useUpdateSource(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SourceItem>) => api.patch<{ data: SourceItem }>(`/api/sources/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sources", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["dashboard", "stock"] });
    },
  });
}

export function useDeleteSource(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/sources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

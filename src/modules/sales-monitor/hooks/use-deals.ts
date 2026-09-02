import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import type { PaginatedResponse } from "@/types";

export interface DealListItem {
  id: string;
  projectName: string;
  buyer: string;
  buyerCountry: string | null;
  segment: string;
  quantity: number;
  pricePerMt: number | null;
  dealNumber: string | null;
  status: string;
  shippingTerm: string | null;
  laycanPol: string | null;
  vesselName: string | null;
  specGar: number | null;
  specTs: number | null;
  specAsh: number | null;
  createdAt: string;
}

export interface DealDetail extends DealListItem {
  commodity: string | null;
  specTm: number | null;
  type: string | null;
  notes: string | null;
  linkedShipmentId: string | null;
  linkedProjectId: string | null;
  updatedAt: string;
}

interface DealFilters {
  page?: number;
  status?: string;
  search?: string;
}

const KEYS = {
  list:   (f: DealFilters) => ["deals", "list", f],
  detail: (id: string)     => ["deals", "detail", id],
};

export function useDealList(filters: DealFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<DealListItem>>(`/api/deals?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useDealDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: DealDetail }>(`/api/deals/${id}`),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DealDetail>) =>
      api.post<{ data: DealDetail }>("/api/deals", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); notify("Deal created"); },
    onError: (error) => notify(formatApiError(error, "Deal create failed"), "error"),
  });
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DealDetail>) =>
      api.patch<{ data: DealDetail }>(`/api/deals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      notify("Deal updated");
    },
    onError: (error) => notify(formatApiError(error, "Deal update failed"), "error"),
  });
}

export function useDeleteDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); notify("Deal deleted"); },
    onError: (error) => notify(formatApiError(error, "Deal delete failed"), "error"),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

export interface PartnerItem {
  id: string; name: string; type: string; country: string | null;
  address: string | null; contactName: string | null;
  contactEmail: string | null; contactPhone: string | null;
  npwp: string | null; bankAccount: string | null; fleetSize: number | null;
  legalDocuments: { name: string; expiryDate?: string; status?: string }[] | null;
  aiDueDiligence: { riskLevel: string; score: number; summary: string; recommendations: string[]; flags: string[]; isStub?: boolean } | null;
  isActive: boolean; notes: string | null; createdAt: string; updatedAt: string;
}

interface Filters { page?: number; type?: string; search?: string; }

const KEYS = {
  list:   (f: Filters) => ["directory", "list", f],
  detail: (id: string) => ["directory", "detail", id],
};

export function usePartnerList(filters: Filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.type   && filters.type   !== "all" ? { type:   filters.type   } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<PartnerItem>>(`/api/directory?${params}`),
    placeholderData: (prev) => prev,
    staleTime: 15 * 60 * 1000, // directory rarely changes
  });
}

export function usePartnerDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: PartnerItem }>(`/api/directory/${id}`),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PartnerItem>) =>
      api.post<{ data: PartnerItem }>("/api/directory", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory"] }),
  });
}

export function useUpdatePartner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PartnerItem>) =>
      api.patch<{ data: PartnerItem }>(`/api/directory/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directory", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeletePartner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/directory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory"] }),
  });
}

export function useRunDueDiligence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: PartnerItem["aiDueDiligence"] }>(`/api/directory/${id}/due-diligence`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directory", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface SupplierCandidate {
  id: string;
  forecastProjectId: string;
  sourceId?: string | null;
  supplierName: string;
  origin?: string | null;
  stockMt?: number | null;
  priceUsd?: number | null;
  readinessStatus?: string | null;
  legalStatus?: string | null;
  gar?: number | null;
  nar?: number | null;
  tm?: number | null;
  im?: number | null;
  ts?: number | null;
  ash?: number | null;
  vm?: number | null;
  hgi?: number | null;
  size?: string | null;
  fitScore?: number | null;
  belowSpecFlags?: Record<string, string> | null;
  belowSpecAcknowledged: boolean;
  belowSpecReason?: string | null;
  selected: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useForecastSupplierCandidates(forecastId: string) {
  return useQuery({
    queryKey: ["forecasts", forecastId, "candidates"],
    queryFn: () => api.get<{ data: SupplierCandidate[] }>(`/api/forecasts/${forecastId}/candidates`),
    enabled: !!forecastId,
  });
}

export function useCreateCandidate(forecastId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierCandidate>) =>
      api.post<{ data: SupplierCandidate }>(`/api/forecasts/${forecastId}/candidates`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId, "candidates"] });
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId] });
    },
  });
}

export function useUpdateCandidate(forecastId: string, candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierCandidate>) =>
      api.patch<{ data: SupplierCandidate }>(`/api/forecasts/${forecastId}/candidates/${candidateId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId, "candidates"] });
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId] });
    },
  });
}

export function useDeleteCandidate(forecastId: string, candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/forecasts/${forecastId}/candidates/${candidateId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId, "candidates"] });
      qc.invalidateQueries({ queryKey: ["forecasts", forecastId] });
    },
  });
}

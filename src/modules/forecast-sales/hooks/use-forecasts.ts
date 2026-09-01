import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import type { PaginatedResponse } from "@/types";

export interface ForecastListItem {
  id: string;
  projectName: string;
  buyer: string;
  buyerCountry: string | null;
  buyerFeedbackStatus?: string | null;
  segment: string | null;
  quantity: number | null;
  quantityUnit: string;
  entity?: string | null;
  offerDate?: string | null;
  attention?: string | null;
  buyerCode?: string | null;
  quantityTolerance?: string | null;
  validityDate?: string | null;
  subjectToCargoUnsold?: boolean | null;
  basePriceMethod?: string | null;
  formula?: string | null;
  averagePeriod?: string | null;
  applyPriceAdjustment?: boolean | null;
  adjustmentFormula?: string | null;
  rejectionGar?: number | null;
  specStandard?: string | null;
  specificationSource?: string | null;
  validityTime?: string | null;
  timezone?: string | null;
  calculationHistoryId?: string | null;
  calculatorSnapshot?: Record<string, unknown> | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  shippingTerm: string | null;
  pol: string | null;
  pod: string | null;
  salesPriceEst: number | null;
  buyingPriceEst: number | null;
  freightEst: number | null;
  marginEst: number | null;
  specGar: number | null;
  specNar: number | null;
  specTs: number | null;
  specAsh: number | null;
  specTm: number | null;
  specIm: number | null;
  specVm: number | null;
  specHgi: number | null;
  specSize: string | null;
  status: string;
  fcoNumber: string | null;
  fcoVersion: number | null;
  forecastMonth?: string | null;
  commodity?: string | null;
  priceBasis?: string | null;
  paymentTerm?: string | null;
  surveyor?: string | null;
  templateType?: string | null;
  templateChecklist?: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  _count: { approvals: number };
}

export interface ForecastSupplierCandidate {
  id: string;
  supplierName: string;
  origin: string | null;
  stockMt: number | null;
  priceUsd: number | null;
  readinessStatus: string | null;
  legalStatus: string | null;
  gar: number | null;
  nar: number | null;
  tm: number | null;
  im: number | null;
  ts: number | null;
  ash: number | null;
  vm: number | null;
  hgi: number | null;
  size: string | null;
  fitScore: number | null;
  belowSpecFlags: Record<string, unknown> | null;
  belowSpecAcknowledged: boolean;
  belowSpecReason: string | null;
  selected: boolean;
  notes: string | null;
}

export interface ForecastDetail extends ForecastListItem {
  remarks: string | null;
  roughPl: Record<string, unknown> | null;
  buyerFeedback: string | null;
  buyerFeedbackStatus: string | null;
  buyerFeedbackReason: string | null;
  buyerFeedbackUpdatedAt: string | null;
  buyerFeedbackHistory: { status: string; reason: string | null; timestamp: string; userId: string; userName: string }[] | null;
  failedReason: string | null;
  failedCategory: string | null;
  linkedShipmentId: string | null;
  approvals: {
    id: string; status: string; comment: string | null; createdAt: string;
    user: { id: string; name: string; role: string };
  }[];
  revisions: {
    id: string; changes: unknown; reason: string; statusAtChange: string; createdAt: string;
    user: { id: string; name: string };
  }[];
  fcoRecords: {
    id: string; fcoNumber: string; version: number; pdfUrl: string | null; generatedAt: string;
  }[];
  _count: { approvals: number; shipments: number };
}

interface ForecastFilters {
  page?: number;
  status?: string;
  search?: string;
  segment?: string;
}

const KEYS = {
  list:   (f: ForecastFilters) => ["forecasts", "list", f],
  detail: (id: string)         => ["forecasts", "detail", id],
};

export function useForecastList(filters: ForecastFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status  && filters.status  !== "all" ? { status:  filters.status  } : {}),
    ...(filters.segment && filters.segment !== "all" ? { segment: filters.segment } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<PaginatedResponse<ForecastListItem>>(`/api/forecasts?${params}`),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });
}

export function useForecastDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get<{ data: ForecastDetail }>(`/api/forecasts/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useForecastSupplierCandidates(id: string) {
  return useQuery({
    queryKey: ["forecasts", "supplier-candidates", id],
    queryFn: () => api.get<{ data: ForecastSupplierCandidate[] }>(`/api/forecasts/${id}/supplier-candidates`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ForecastListItem>) =>
      api.post<{ data: ForecastListItem }>("/api/forecasts", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forecasts"] }); notify("Forecast created"); },
    onError: () => notify("Forecast create failed", "error"),
  });
}

export function useUpdateForecast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ForecastDetail>) =>
      api.patch<{ data: ForecastDetail }>(`/api/forecasts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts", "list"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      notify("Forecast updated");
    },
    onError: () => notify("Forecast update failed", "error"),
  });
}

export function useSubmitForecast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/forecasts/${id}/submit`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forecasts"] }); notify("Forecast submitted"); },
    onError: () => notify("Forecast submit failed", "error"),
  });
}

export function useApproveForecast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { action: string; comment?: string }) =>
      api.post(`/api/forecasts/${id}/approve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Forecast approval saved");
    },
    onError: () => notify("Forecast approval failed", "error"),
  });
}

export function useReviseForecast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { changes: unknown[]; reason: string; updates?: Record<string,unknown> }) =>
      api.post(`/api/forecasts/${id}/revision`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forecasts"] }); notify("Revision requested"); },
    onError: () => notify("Revision failed", "error"),
  });
}

export function useMarkForecastFailed(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { failedReason: string; failedCategory?: string; buyerFeedback?: string }) =>
      api.post(`/api/forecasts/${id}/mark-failed`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forecasts"] }); notify("Forecast marked failed"); },
    onError: () => notify("Mark failed failed", "error"),
  });
}

export function useUpdateBuyerFeedback(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; reason?: string }) =>
      api.post(`/api/forecasts/${id}/buyer-feedback`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      notify("Buyer feedback updated");
    },
    onError: () => notify("Buyer feedback failed", "error"),
  });
}

export function useConvertToShipment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      shipmentNumber: string; vesselName?: string; bargeName?: string;
      source?: string; supplier?: string; pic?: string;
    }) => api.post(`/api/forecasts/${id}/convert-shipment`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecasts"] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      notify("Forecast converted to shipment");
    },
    onError: () => notify("Convert to shipment failed", "error"),
  });
}

export function useDeleteForecast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/forecasts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forecasts"] }); notify("Forecast deleted"); },
    onError: () => notify("Forecast delete failed", "error"),
  });
}

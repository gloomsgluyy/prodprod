import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";

export interface OutstandingPaymentItem {
  id: string;
  shipmentId: string | null;
  shipment: { shipmentNumber: string } | null;
  invoiceNumber: string | null;
  perusahaan: string;
  kodeBatu: string | null;
  priceInclPph: number | null;
  quantity: number | null;
  totalDp: number | null;
  tahun: number;
  calculationDate: string | null;
  dpToShipmentDate: string | null;
  dueDate: string | null;
  disputeStatus: string | null;
  timeframe: string | null;
  status: "pending" | "partial" | "paid";
  notes: string | null;
  invoiceDocumentId: string | null;
  paymentProofDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMeta {
  total: number; page: number; pageSize: number; totalPages: number;
  totalQty: number; totalDp: number;
}

interface PaymentFilters { page?: number; status?: string; search?: string; }

const KEYS = {
  list: (f: PaymentFilters) => ["outstanding-payments", "list", f],
};

export function useOutstandingPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<{ data: OutstandingPaymentItem[]; meta: PaymentMeta }>(`/api/outstanding-payments?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OutstandingPaymentItem>) =>
      api.post<{ data: OutstandingPaymentItem }>("/api/outstanding-payments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outstanding-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "blockers"] });
    },
    onError: (error) => notify(formatApiError(error, "Payment create failed"), "error"),
  });
}

export function useUpdatePayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OutstandingPaymentItem>) =>
      api.patch<{ data: OutstandingPaymentItem }>(`/api/outstanding-payments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outstanding-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "blockers"] });
    },
    onError: (error) => notify(formatApiError(error, "Payment update failed"), "error"),
  });
}

export function useDeletePayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/outstanding-payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outstanding-payments"] }),
    onError: (error) => notify(formatApiError(error, "Payment delete failed"), "error"),
  });
}

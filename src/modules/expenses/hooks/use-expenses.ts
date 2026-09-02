import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";

export interface ExpenseItem {
  id: string; description: string; amount: number; currency: string;
  category: string; supplierName: string | null; priority: string; status: string;
  imageUrl: string | null; notes: string | null; relatedShipmentId: string | null; shipmentId?: string | null;
  approvedAt: string | null;
  submittedBy: { id: string; name: string };
  approvedBy:  { id: string; name: string } | null;
  createdAt: string; updatedAt: string;
}

interface ExpenseMeta {
  total: number; page: number; pageSize: number; totalPages: number; totalAmount: number;
}

interface Filters { page?: number; status?: string; search?: string; shipmentOnly?: boolean; }

const KEYS = {
  list: (f: Filters) => ["expenses", "list", f],
};

export function useExpenseList(filters: Filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.shipmentOnly ? { shipmentOnly: "true" } : {}),
  }).toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => api.get<{ data: ExpenseItem[]; meta: ExpenseMeta }>(`/api/expenses?${params}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExpenseItem> & { submitNow?: boolean }) =>
      api.post<{ data: ExpenseItem }>("/api/expenses", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); notify("Expense created"); },
    onError: (error) => notify(formatApiError(error, "Expense create failed"), "error"),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExpenseItem>) =>
      api.patch<{ data: ExpenseItem }>(`/api/expenses/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); notify("Expense updated"); },
    onError: (error) => notify(formatApiError(error, "Expense update failed"), "error"),
  });
}

export function useDeleteExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/expenses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); notify("Expense deleted"); },
    onError: (error) => notify(formatApiError(error, "Expense delete failed"), "error"),
  });
}

export function useApproveExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { action: "approved" | "rejected"; notes?: string }) =>
      api.post<{ data: ExpenseItem }>(`/api/expenses/${id}/approve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["profit-loss"] });
      notify("Expense approval saved");
    },
    onError: (error) => notify(formatApiError(error, "Expense approval failed"), "error"),
  });
}

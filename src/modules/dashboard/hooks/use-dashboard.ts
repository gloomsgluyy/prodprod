import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  DashboardMetrics,
  BlockerAlert,
  DocumentAgingAlert,
  TaskItem,
  MeetingItem,
} from "@/types";

interface DashboardFilters {
  status?: string;
  marketType?: string;
}

export function useDashboardMetrics(filters: DashboardFilters = {}) {
  const params = new URLSearchParams(filters as Record<string, string>).toString();
  return useQuery({
    queryKey: ["dashboard", "metrics", filters],
    queryFn: () => api.get<{ data: DashboardMetrics }>(`/api/dashboard/metrics?${params}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarketMini() {
  return useQuery({
    queryKey: ["dashboard", "market-mini"],
    queryFn: () => api.get<{ data: { latest: Record<string, unknown> | null; prev: Record<string, unknown> | null } }>("/api/dashboard/market-mini"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVolumeData(year: number, segment: string) {
  return useQuery({
    queryKey: ["dashboard", "volume", year, segment],
    queryFn: () => api.get<{ data: { total: number; byStatus: Record<string, number>; year: number; segment: string } }>(`/api/dashboard/volume?year=${year}&segment=${segment}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMonthlyChart(year: number) {
  return useQuery({
    queryKey: ["dashboard", "chart-monthly", year],
    queryFn: () => api.get<{ data: { month: string; local: number; export: number }[] }>(`/api/dashboard/chart-monthly?year=${year}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePriorityTasks() {
  return useQuery({
    queryKey: ["dashboard", "tasks-priority"],
    queryFn: () => api.get<{ data: TaskItem[] }>("/api/dashboard/tasks-priority"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpcomingMeetings() {
  return useQuery({
    queryKey: ["dashboard", "meetings-upcoming"],
    queryFn: () => api.get<{ data: MeetingItem[] }>("/api/dashboard/meetings-upcoming"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStockInventory() {
  return useQuery({
    queryKey: ["dashboard", "stock"],
    queryFn: () => api.get<{ data: { totalMt: number; top: { id: string; supplierName: string; stockAvailable: number }[] } }>("/api/dashboard/stock"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveShipments() {
  return useQuery({
    queryKey: ["dashboard", "shipments-active"],
    queryFn: () => api.get<{ data: unknown[] }>("/api/dashboard/shipments-active"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useApprovalPending() {
  return useQuery({
    queryKey: ["dashboard", "approval-pending"],
    queryFn: () => api.get<{ data: unknown[] }>("/api/dashboard/approval-pending"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDocumentAging() {
  return useQuery({
    queryKey: ["dashboard", "document-aging"],
    queryFn: () => api.get<{ data: DocumentAgingAlert[] }>("/api/dashboard/document-aging"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBlockers() {
  return useQuery({
    queryKey: ["dashboard", "blockers"],
    queryFn: () => api.get<{ data: BlockerAlert[] }>("/api/dashboard/blockers"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserActivity() {
  return useQuery({
    queryKey: ["dashboard", "user-activity"],
    queryFn: () => api.get<{ data: unknown }>("/api/dashboard/user-activity"),
    staleTime: 5 * 60 * 1000,
    retry: false, // 403 for non-CEO — don't retry
  });
}

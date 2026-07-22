import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

interface MarketEntry {
  id: string; date: string;
  ici1: number|null; ici2: number|null; ici3: number|null; ici4: number|null; ici5: number|null;
  newcastle: number|null; hba: number|null; hba1: number|null; hba2: number|null; hba3: number|null;
  source: string; action: string; createdAt: string;
  user: { name: string };
}

interface ChartPoint {
  date: string;
  ici1: number|null; ici2: number|null; ici3: number|null; ici4: number|null; ici5: number|null;
  newcastle: number|null; hba: number|null;
}

const KEYS = {
  list:   (page: number) => ["market-price", "list", page],
  latest: ()             => ["market-price", "latest"],
  chart:  (range: string)=> ["market-price", "chart", range],
};

export function useMarketPriceList(page = 1) {
  return useQuery({
    queryKey: KEYS.list(page),
    queryFn: () => api.get<PaginatedResponse<MarketEntry>>(`/api/market-price?page=${page}`),
    placeholderData: (prev) => prev,
  });
}

export function useMarketPriceLatest() {
  return useQuery({
    queryKey: KEYS.latest(),
    queryFn: () => api.get<{ data: { latest: MarketEntry|null; prev: Record<string,number|null>|null } }>("/api/market-price/latest"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketPriceChart(range: string) {
  return useQuery({
    queryKey: KEYS.chart(range),
    queryFn: () => api.get<{ data: ChartPoint[] }>(`/api/market-price/chart?range=${range}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddMarketPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, number>) => api.post<{ data: MarketEntry }>("/api/market-price", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-price"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "market-mini"] });
    },
  });
}

export function useScrapeMarketPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ data: MarketEntry; message: string }>("/api/market-scrape", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-price"] }),
  });
}

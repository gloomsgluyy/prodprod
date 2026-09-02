import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

interface MarketEntry {
  id: string; date: string;
  ici1: number|null; ici2: number|null; ici3: number|null; ici4: number|null; ici5: number|null;
  newcastle: number|null; hba: number|null; hba1: number|null; hba2: number|null; hba3: number|null;
  mgoUsd: number|null; usdIdr: number|null;
  source: string; action: string; notes: string|null; createdAt: string;
  user: { name: string } | null;
}
interface ChartPoint {
  date: string;
  ici1: number|null; ici2: number|null; ici3: number|null; ici4: number|null; ici5: number|null;
  newcastle: number|null; hba: number|null; mgoUsd: number|null; usdIdr: number|null;
}

export interface MarketPriceInput {
  date?: string;
  source?: string;
  notes?: string;
  ici1?: number;
  ici2?: number;
  ici3?: number;
  ici4?: number;
  ici5?: number;
  newcastle?: number;
  hba?: number;
  hba1?: number;
  hba2?: number;
  hba3?: number;
  mgoUsd?: number;
  usdIdr?: number;
}

const KEYS = {
  list:   (page: number) => ["market-price", "list", page],
  latest: ()             => ["market-price", "latest"],
  chart:  (range: string)=> ["market-price", "chart", range],
  calculatorIndexes: (asOf: string) => ["market-price", "calculator-indexes", asOf],
  calculatorHistory: () => ["market-price", "calculator-history"],
};

export interface CalculatorHistoryEntry {
  id: string;
  calculationType: string;
  baseIndex: string;
  baseIndexDate: string;
  baseIndexValue: number;
  baseIndexes: unknown;
  baseIndexWeights: Record<string, number> | null;
  marketPriceSnapshot: Record<string, unknown> | null;
  prorataMethod: string;
  baseGar: number | null;
  targetGar: number | null;
  targetProrataMethod: string | null;
  priceAfterProrata: number | null;
  basis: string | null;
  basisAdjustment: number | null;
  basisDescription: string | null;
  priceAfterBasis: number | null;
  actualTs: number | null;
  contractTs: number | null;
  tsAdjustment: number | null;
  actualAsh: number | null;
  contractAsh: number | null;
  ashAdjustment: number | null;
  qualityAdjustment: number;
  premiumDiscount: number;
  description: string | null;
  finalPrice: number;
  createdAt: string;
  createdBy: { name: string };
}

export function useCalculatorIndexes(asOf?: string) {
  const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return useQuery({
    queryKey: KEYS.calculatorIndexes(asOf ?? "latest"),
    queryFn: () => api.get<{ data: { indexes: Record<string, number | null>; dates: Record<string, string | null>; asOf: string | null } }>(`/api/market-price/calculator/indexes${query}`),
  });
}

export function useCalculatorHistory() {
  return useQuery({
    queryKey: KEYS.calculatorHistory(),
    queryFn: () => api.get<{ data: CalculatorHistoryEntry[] }>("/api/market-price/calculator/history"),
  });
}

export function useSaveCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<{ data: { id: string } }>("/api/market-price/calculator/save", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.calculatorHistory() }),
  });
}

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
    queryFn: () => api.get<{ data: { latest: MarketEntry|null; prev: Record<string,number|null>|null; latestDates?: Record<string,string|null> } }>("/api/market-price/latest"),
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
    mutationFn: (data: MarketPriceInput) => api.post<{ data: MarketEntry }>("/api/market-price", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["market-price", "latest"] });
      qc.invalidateQueries({ queryKey: ["market-price", "list"] });
      qc.invalidateQueries({ queryKey: ["market-price", "chart"] });
      qc.invalidateQueries({ queryKey: ["market-price", "warnings"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "market-mini"] });
    },
  });
}


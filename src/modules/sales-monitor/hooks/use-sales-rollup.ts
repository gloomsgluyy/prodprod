"use client";
import { useQuery } from "@tanstack/react-query";

type SalesRollup = {
  projectId: string | null;
  projectName: string;
  buyer: string;
  segment: string | null;
  forecastStatus: string | null;
  salesStatus: string;
  dealCount: number;
  shipmentCount: number;
  qtyTotal: number;
  revenueEstimate: number;
};

type SalesRollupSummary = {
  totalRevenue: number;
  totalVolume: number;
  totalDeals: number;
  totalShipments: number;
};

type SalesRollupResponse = {
  data: SalesRollup[];
  summary: SalesRollupSummary;
};

export function useSalesRollup() {
  return useQuery<SalesRollupResponse>({
    queryKey: ["sales-rollup"],
    queryFn: async () => {
      const res = await fetch("/api/sales-monitor/rollup");
      if (!res.ok) throw new Error("Failed to fetch sales rollup");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface MarketComparison {
  latestMarket: {
    date: string;
    ici3: number | null;
    ici4: number | null;
    hba: number | null;
    newcastle: number | null;
  } | null;
  avgSalesPrice: number;
  avgBuyingPrice: number;
  salesSpread: number;
  buyingSpread: number;
  margin: number;
  dealCount: number;
  shipmentCount: number;
  forecastCount: number;
}

function useMarketComparison() {
  return useQuery({
    queryKey: ["market-comparison"],
    queryFn: () => api.get<{ data: MarketComparison }>("/api/market-price/comparison"),
    staleTime: 5 * 60 * 1000,
  });
}

export function MarketComparisonCard() {
  const { data, isLoading } = useMarketComparison();
  const comparison = data?.data;

  const [selectedBenchmark, setSelectedBenchmark] = useState<"ici3" | "ici4" | "hba" | "newcastle">("ici4");

  if (isLoading) {
    return (
      <div className="card">
        <div className="card__body space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  if (!comparison || !comparison.latestMarket) {
    return (
      <div className="card">
        <div className="card__body py-8 text-center text-muted-foreground">
          No market data available for comparison
        </div>
      </div>
    );
  }

  const benchmark = comparison.latestMarket[selectedBenchmark] ?? 0;
  const salesSpreadVsBenchmark = comparison.avgSalesPrice - benchmark;
  const buyingSpreadVsBenchmark = comparison.avgBuyingPrice - benchmark;

  const spreadColor = (spread: number) => {
    if (spread > 3) return "text-green-500";
    if (spread < -3) return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <div className="card">
      <div className="card__body gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Market Price Comparison</h3>
          <select
            className="select select--sm w-32"
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value as typeof selectedBenchmark)}
          >
            <option value="ici3">ICI3</option>
            <option value="ici4">ICI4</option>
            <option value="hba">HBA</option>
            <option value="newcastle">Newcastle</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Benchmark ({selectedBenchmark.toUpperCase()})</p>
            <p className="text-2xl font-semibold text-blue-500">${benchmark.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {comparison.latestMarket.date ? new Date(comparison.latestMarket.date).toLocaleDateString() : "—"}
            </p>
          </div>

          <div className="bg-muted/30 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Sales Price</p>
            <p className="text-2xl font-semibold text-green-500">${comparison.avgSalesPrice.toFixed(2)}</p>
            <p className={`text-xs font-semibold mt-1 ${spreadColor(salesSpreadVsBenchmark)}`}>
              {salesSpreadVsBenchmark >= 0 ? "+" : ""}{salesSpreadVsBenchmark.toFixed(2)} vs benchmark
            </p>
          </div>

          <div className="bg-muted/30 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Buying Price</p>
            <p className="text-2xl font-semibold text-orange-500">${comparison.avgBuyingPrice.toFixed(2)}</p>
            <p className={`text-xs font-semibold mt-1 ${spreadColor(buyingSpreadVsBenchmark)}`}>
              {buyingSpreadVsBenchmark >= 0 ? "+" : ""}{buyingSpreadVsBenchmark.toFixed(2)} vs benchmark
            </p>
          </div>

          <div className="bg-muted/30 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Margin</p>
            <p className="text-2xl font-semibold text-emerald-500">${comparison.margin.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">/MT</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold text-blue-500">{comparison.forecastCount}</p>
            <p className="text-xs text-muted-foreground">Forecasts</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-indigo-500">{comparison.dealCount}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-violet-500">{comparison.shipmentCount}</p>
            <p className="text-xs text-muted-foreground">Shipments</p>
          </div>
        </div>

        <div className="bg-primary/10 rounded p-3">
          <p className="text-eyebrow mb-2">Analysis</p>
          <div className="space-y-1 text-sm">
            {salesSpreadVsBenchmark > 3 && (
              <p className="text-green-600">✓ Sales price is {salesSpreadVsBenchmark.toFixed(2)} USD/MT above benchmark — favorable positioning.</p>
            )}
            {salesSpreadVsBenchmark < -3 && (
              <p className="text-red-600">⚠ Sales price is {Math.abs(salesSpreadVsBenchmark).toFixed(2)} USD/MT below benchmark — review pricing strategy.</p>
            )}
            {Math.abs(salesSpreadVsBenchmark) <= 3 && (
              <p className="text-yellow-600">→ Sales price is within ±3 USD/MT of benchmark — normal range.</p>
            )}
            {comparison.margin < 0 && (
              <p className="text-red-600">⚠ Negative margin detected — review cost structure urgently.</p>
            )}
            {comparison.margin > 5 && (
              <p className="text-green-600">✓ Healthy margin above $5/MT — execution risk primarily operational.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

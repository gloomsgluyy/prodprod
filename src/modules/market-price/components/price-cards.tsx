"use client";

import { useMarketPriceLatest } from "../hooks/use-market-price";

const INDICES = [
  { key: "ici1", label: "ICI 1 (6500)", color: "#ef4444", prefix: "$", decimals: 2 },
  { key: "ici2", label: "ICI 2 (5800)", color: "#f59e0b", prefix: "$", decimals: 2 },
  { key: "ici3", label: "ICI 3 (5000)", color: "#3b82f6", prefix: "$", decimals: 2 },
  { key: "ici4", label: "ICI 4 (4200)", color: "#8b5cf6", prefix: "$", decimals: 2 },
  { key: "ici5", label: "ICI 5 (3400)", color: "#6366f1", prefix: "$", decimals: 2 },
  { key: "newcastle", label: "Newcastle", color: "#ec4899", prefix: "$", decimals: 2 },
  { key: "hba", label: "HBA", color: "#10b981", prefix: "$", decimals: 2 },
  { key: "hba1", label: "HBA I (5300)", color: "#14b8a6", prefix: "$", decimals: 2 },
  { key: "hba2", label: "HBA II (4100)", color: "#06b6d4", prefix: "$", decimals: 2 },
  { key: "hba3", label: "HBA III (3400)", color: "#0ea5e9", prefix: "$", decimals: 2 },
  { key: "mgoUsd", label: "MGO USD/MT", color: "#64748b", prefix: "$", decimals: 2 },
  { key: "usdIdr", label: "USD/IDR", color: "#92400e", prefix: "Rp", decimals: 0 },
] as const;

type K = typeof INDICES[number]["key"];

function formatPrice(value: number, prefix: string, decimals: number) {
  return `${prefix}${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function PriceCards() {
  const { data, isLoading } = useMarketPriceLatest();
  const latest = data?.data?.latest as Record<K, number | null> | null | undefined;
  const prev = data?.data?.prev as Record<K, number | null> | null | undefined;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
        {INDICES.map((i) => <div key={i.key} className="card p-4 animate-pulse h-24" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
      {INDICES.map((idx) => {
        const price = latest?.[idx.key] ?? null;
        const prevPrice = prev?.[idx.key] ?? null;
        const delta = price != null && prevPrice != null ? price - prevPrice : null;

        return (
          <div key={idx.key} className="card p-4">
            <p className="text-eyebrow mb-2 truncate">{idx.label}</p>
            <p className="text-xl font-semibold" style={{ color: idx.color }}>
              {price != null ? formatPrice(Number(price), idx.prefix, idx.decimals) : "-"}
            </p>
            {delta != null && (
              <p className={`text-xs mt-1 font-medium ${delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {delta >= 0 ? "+" : "-"} {formatPrice(Math.abs(delta), idx.prefix, idx.decimals)}
              </p>
            )}
            {price == null && <p className="text-xs text-muted-foreground mt-1">No data</p>}
          </div>
        );
      })}
    </div>
  );
}

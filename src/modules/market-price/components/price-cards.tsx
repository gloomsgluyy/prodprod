"use client";

import { useMarketPriceLatest } from "../hooks/use-market-price";

const INDICES = [
  { key: "ici1", label: "ICI 1 (6500)", decimals: 2 }, { key: "ici2", label: "ICI 2 (5800)", decimals: 2 },
  { key: "ici3", label: "ICI 3 (5000)", decimals: 2 }, { key: "ici4", label: "ICI 4 (4200)", decimals: 2 },
  { key: "ici5", label: "ICI 5 (3400)", decimals: 2 }, { key: "newcastle", label: "Newcastle", decimals: 2 },
  { key: "hba", label: "HBA", decimals: 2 }, { key: "hba1", label: "HBA I (5300)", decimals: 2 },
  { key: "hba2", label: "HBA II (4100)", decimals: 2 }, { key: "hba3", label: "HBA III (3400)", decimals: 2 },
  { key: "mgoUsd", label: "MGO USD/MT", decimals: 2 }, { key: "usdIdr", label: "USD/IDR", decimals: 0 },
] as const;

type K = typeof INDICES[number]["key"];

const UPDATE_FREQUENCY: Record<K, string> = {
  ici1: "Weekly",
  ici2: "Weekly",
  ici3: "Weekly",
  ici4: "Weekly",
  ici5: "Weekly",
  newcastle: "Weekly",
  hba: "Bi-weekly",
  hba1: "Bi-weekly",
  hba2: "Bi-weekly",
  hba3: "Bi-weekly",
  mgoUsd: "Daily",
  usdIdr: "Daily",
};

function formatPrice(value: number, decimals: number, key: K) {
  const prefix = key === "usdIdr" ? "Rp" : "$";
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

        return <div key={idx.key} className="card p-4"><p className="text-eyebrow mb-2 truncate" title={idx.label}>{idx.label}</p><p className="text-xl font-semibold">{price != null ? formatPrice(Number(price), idx.decimals, idx.key) : "-"}<span className="ml-1 text-xs font-normal text-muted-foreground">/MT</span></p>{delta != null && <p className={`mt-1 text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>{delta >= 0 ? "▲" : "▼"} {formatPrice(Math.abs(delta), idx.decimals, idx.key)}</p>}<p className="mt-1 text-xs text-muted-foreground">{UPDATE_FREQUENCY[idx.key]}</p>{price == null && <p className="mt-1 text-xs text-muted-foreground">No data</p>}</div>;
      })}
    </div>
  );
}

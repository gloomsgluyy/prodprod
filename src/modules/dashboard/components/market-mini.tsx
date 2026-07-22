"use client";

import Link from "next/link";
import { useMarketMini } from "../hooks/use-dashboard";

const INDICES = [
  { key: "ici1",      label: "ICI 1 (6500)",  color: "#ef4444" },
  { key: "ici2",      label: "ICI 2 (5800)",  color: "#f59e0b" },
  { key: "ici3",      label: "ICI 3 (5000)",  color: "#3b82f6" },
  { key: "ici4",      label: "ICI 4 (4200)",  color: "#8b5cf6" },
  { key: "ici5",      label: "ICI 5 (3400)",  color: "#6366f1" },
  { key: "newcastle", label: "Newcastle",      color: "#ec4899" },
  { key: "hba",       label: "HBA",            color: "#10b981" },
  { key: "hba1",      label: "HBA I (5300)",   color: "#14b8a6" },
  { key: "hba2",      label: "HBA II (4100)",  color: "#06b6d4" },
  { key: "hba3",      label: "HBA III (3400)", color: "#0ea5e9" },
] as const;

export function MarketMini() {
  const { data, isLoading } = useMarketMini();
  const latest = data?.data?.latest as Record<string, number | null> | null;
  const prev   = data?.data?.prev   as Record<string, number | null> | null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 xl:grid-cols-10 gap-3">
        {INDICES.map((idx) => (
          <div key={idx.key} className="card animate-pulse p-3">
            <div className="h-2 bg-muted rounded w-16 mb-2" />
            <div className="h-5 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 xl:grid-cols-10 gap-3">
      {INDICES.map((idx) => {
        const price = latest?.[idx.key] != null ? Number(latest[idx.key]) : null;
        const prevPrice = prev?.[idx.key] != null ? Number(prev[idx.key]) : null;
        const delta = price != null && prevPrice != null ? price - prevPrice : null;

        return (
          <div key={idx.key} className="card p-3">
            <p className="text-eyebrow mb-1">{idx.label}</p>
            <p className="font-semibold text-sm" style={{ color: idx.color }}>
              {price != null ? `$${price.toFixed(2)}` : "—"}
            </p>
            {delta != null && (
              <p className={`text-xs mt-0.5 ${delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(2)}
              </p>
            )}
            <Link href="/market-price" className="link text-xs mt-1 block">
              Detail →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

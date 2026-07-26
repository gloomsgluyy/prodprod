"use client";

import { useDashboardMetrics } from "../hooks/use-dashboard";
import { useDashboardUIStore } from "../store/dashboard-ui-store";
import { useAuthStore } from "@/modules/auth/store/auth-store";

const CARDS = [
  { key: "totalShipments",  label: "Total Shipments",  color: "text-blue-500",    unit: "" },
  { key: "activeShipments", label: "Active Shipments", color: "text-emerald-500", unit: "" },
  { key: "totalVolumeMt",   label: "Total Volume",     color: "text-violet-500",  unit: "MT" },
] as const;

const EXEC_CARDS = [
  { key: "revenueUsd",   label: "Revenue",     color: "text-amber-500", unit: "USD", prefix: "$" },
  { key: "avgMarginMt",  label: "Avg Margin",  color: "text-rose-500",  unit: "/MT", prefix: "$" },
] as const;

function fmt(n: number, prefix = "", unit = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M ${unit}`.trim();
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K ${unit}`.trim();
  return `${prefix}${n.toLocaleString()} ${unit}`.trim();
}

export function MetricCards() {
  const { filters } = useDashboardUIStore();
  const { isExecutive } = useAuthStore();
  const { data, isLoading } = useDashboardMetrics({
    status: filters.status,
    marketType: filters.marketType,
    country: filters.country,
    region: filters.region,
    timeRange: filters.timeRange,
    customStart: filters.customStart,
    customEnd: filters.customEnd,
  });
  const metrics = data?.data;

  if (isLoading) return <MetricCardsSkeleton count={isExecutive ? 5 : 3} />;

  const allCards = [
    ...CARDS,
    ...(isExecutive ? EXEC_CARDS : []),
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {allCards.map((card) => {
        const val = metrics ? (metrics as unknown as Record<string, number | undefined>)[card.key] : undefined;
        const prefix = "prefix" in card ? card.prefix : "";
        const formatted = val != null ? fmt(val, prefix, card.unit) : "—";

        return (
          <div key={card.key} className="card card--stat">
            <div className="card__body">
              <div className="stat">
                <p className="stat__label text-eyebrow">{card.label}</p>
                <p className={`stat__value text-3xl font-semibold ${card.color}`}>{formatted}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card--stat animate-pulse">
          <div className="card__body">
            <div className="h-3 bg-muted rounded w-24 mb-3" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

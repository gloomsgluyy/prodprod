"use client";

import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { useMarketPriceChart } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";

const LINES = [
  { key: "ici1",      label: "ICI 1",     color: "#ef4444" },
  { key: "ici2",      label: "ICI 2",     color: "#f59e0b" },
  { key: "ici3",      label: "ICI 3",     color: "#3b82f6" },
  { key: "ici4",      label: "ICI 4",     color: "#8b5cf6" },
  { key: "ici5",      label: "ICI 5",     color: "#6366f1" },
  { key: "newcastle", label: "Newcastle", color: "#ec4899" },
] as const;

export function TrendChart() {
  const { chartRange, setChartRange } = useMarketPriceUIStore();
  const { data, isLoading } = useMarketPriceChart(chartRange);

  return (
    <div className="card">
      <div className="card__body gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-eyebrow">Price Trend</p>
          <div className="flex gap-1">
            {(["2w", "4w", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`button button--sm ${chartRange === r ? "button--primary" : "button--ghost button--neutral"}`}
                onClick={() => setChartRange(r)}
                aria-pressed={chartRange === r}
              >
                {r === "2w" ? "2 Weeks" : r === "4w" ? "4 Weeks" : "All"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse bg-muted rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data?.data ?? []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [`$${v?.toFixed(2)}`]} labelStyle={{ fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hba" name="HBA" fill="#10b981" opacity={0.4} />
              {LINES.map((l) => (
                <Line
                  key={l.key} type="monotone" dataKey={l.key}
                  name={l.label} stroke={l.color} dot={false} strokeWidth={1.5}
                  connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMonthlyChart } from "../hooks/use-dashboard";
import { useDashboardUIStore } from "../store/dashboard-ui-store";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

function fmtVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);
}

export function MonthlyChart() {
  const { chartYear, setChartYear } = useDashboardUIStore();
  const { data, isLoading } = useMonthlyChart(chartYear);

  return (
    <div className="card h-full">
      <div className="card__body gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-eyebrow">Quantity per Month</p>
            <p className="text-sm text-muted-foreground">{chartYear} — Local vs Export</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="select select--sm"
              value={chartYear}
              onChange={(e) => setChartYear(Number(e.target.value))}
              aria-label="Select chart year"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Link href="/sales-monitor" className="link text-xs">Detail →</Link>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse bg-muted rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.data ?? []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtVolume} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${fmtVolume(value)} MT`]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="local"  name="Local (Domestic)" stackId="vol" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="export" name="Export"            stackId="vol" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

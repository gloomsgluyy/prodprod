"use client";

import Link from "next/link";
import { useMarketMini } from "../hooks/use-dashboard";

const INDICES = [
  { key: "ici1", label: "ICI 1 (6500)" }, { key: "ici2", label: "ICI 2 (5800)" },
  { key: "ici3", label: "ICI 3 (5000)" }, { key: "ici4", label: "ICI 4 (4200)" },
  { key: "ici5", label: "ICI 5 (3400)" }, { key: "newcastle", label: "Newcastle" },
  { key: "hba", label: "HBA" }, { key: "hba1", label: "HBA I (5300)" },
  { key: "hba2", label: "HBA II (4100)" }, { key: "hba3", label: "HBA III (3400)" },
] as const;

type Window = { from: string; until: string; values: Record<string, number | null> };

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function rangeLabel(window?: Window) {
  if (!window) return "No history";
  const from = new Date(window.from);
  const until = new Date(window.until);
  const sameYear = from.getFullYear() === until.getFullYear();
  const month = (value: Date) => value.toLocaleDateString("en-GB", { month: "short" });
  return sameYear
    ? `${from.getDate()} ${month(from)} - ${until.getDate()} ${month(until)} ${until.getFullYear()}`
    : `${date(window.from)} - ${date(window.until)}`;
}

export function MarketMini() {
  const { data, isLoading, isError } = useMarketMini();
  const latest = data?.data?.latest as (Record<string, number | string | null> & { date?: string }) | null;
  const averages = data?.data?.averages as { twoWeeks: Window; fourWeeks: Window; month: Window } | null;

  if (isLoading) return <div className="card h-72 animate-pulse" />;
  if (isError) return <div className="card p-4 text-sm text-red-600">Market Price Index unavailable. Retry from the browser.</div>;
  if (!latest) return <div className="card p-4 text-sm text-muted-foreground">No market price history available.</div>;

  return (
    <section aria-label="Market Price Index" className="flex flex-col gap-3">
      <div className="flex items-center justify-between"><div><p className="text-eyebrow">Market Price Index</p><p className="text-xs text-muted-foreground">Latest price versus previous 2-week average</p></div><Link href="/market-price" className="link text-xs">Open Market Price →</Link></div>
      <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3 text-black dark:text-white">
        {INDICES.map((index) => {
          const price = latest[index.key] != null ? Number(latest[index.key]) : null;
          const avg = averages?.twoWeeks.values[index.key] ?? null;
          const delta = price != null && avg != null ? price - avg : null;
          const percent = delta != null && avg ? (delta / avg) * 100 : null;
          return <div key={index.key} className="card min-w-0 p-3 text-center"><p className="text-xs font-semibold tracking-wide text-foreground truncate" title={index.label}>{index.label}</p><p className="mt-2 text-xl font-semibold tracking-tight">{price != null ? `$${price.toFixed(2)}` : "—"}<span className="ml-1 text-[10px] font-normal text-muted-foreground">/MT</span></p><p className="mt-1 text-[10px] text-muted-foreground">Date: {date(latest.date)}</p>{delta != null && <div className="mt-3 font-semibold" style={{ color: delta >= 0 ? "#059669" : "#dc2626" }}><p className="text-xs"><span aria-hidden="true">{delta >= 0 ? "▲" : "▼"}</span> ${Math.abs(delta).toFixed(2)} ({Math.abs(percent ?? 0).toFixed(2)}%)</p><p className="mt-0.5 text-[10px] font-normal text-muted-foreground">vs 2-week avg</p></div>}</div>;
        })}
      </div>
      <div className="card overflow-hidden text-black dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-center" aria-label="Market price index comparison">
            <thead>
              <tr className="border-b border-border"><th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">Average</th>{INDICES.map((index) => <th key={index.key} className="px-3 py-3 text-xs font-semibold text-foreground whitespace-nowrap">{index.label}</th>)}</tr>
            </thead>
            <tbody className="text-xs">
              {(["twoWeeks", "fourWeeks", "month"] as const).map((period) => <tr key={period} className="border-b border-border/70 last:border-0"><th className="px-3 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">{period === "twoWeeks" ? "Avg 2 Weeks" : period === "fourWeeks" ? "Avg 4 Weeks" : "Prev. Month"}</th>{INDICES.map((index) => { const window = averages?.[period]; const value = window?.values[index.key] ?? null; return <td key={index.key} className="px-3 py-3 whitespace-nowrap"><span className="font-semibold">{value != null ? `$${value.toFixed(2)}` : "—"}</span>{period === "twoWeeks" && <span className="block text-[10px] text-muted-foreground">{rangeLabel(window)}</span>}</td>; })}</tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

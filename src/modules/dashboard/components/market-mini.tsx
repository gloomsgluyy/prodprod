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

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3">{INDICES.map((index) => <div key={index.key} className="card animate-pulse h-40" />)}</div>;
  if (isError) return <div className="card p-4 text-sm text-red-600">Market Price Index unavailable. Retry from the browser.</div>;
  if (!latest) return <div className="card p-4 text-sm text-muted-foreground">No market price history available.</div>;

  return (
    <section aria-label="Market Price Index" className="flex flex-col gap-3">
      <div className="flex items-center justify-between"><div><p className="text-eyebrow">Market Price Index</p><p className="text-xs text-muted-foreground">Latest price versus previous 2-week average</p></div><Link href="/market-price" className="link text-xs">Open Market Price →</Link></div>
      <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3">
        {INDICES.map((index) => {
          const price = latest[index.key] != null ? Number(latest[index.key]) : null;
          const avg = averages?.twoWeeks.values[index.key] ?? null;
          const delta = price != null && avg != null ? price - avg : null;
          const percent = delta != null && avg ? (delta / avg) * 100 : null;
          const trend = delta == null ? null : delta >= 0 ? "up" : "down";
          return <div key={index.key} className="card min-w-0 p-3 text-center text-black dark:text-white"><p className="text-xs font-semibold tracking-wide text-foreground truncate" title={index.label}>{index.label}</p><p className="mt-2 text-xl font-semibold tracking-tight">{price != null ? `$${price.toFixed(2)}` : "—"}<span className="ml-1 text-[10px] font-normal text-muted-foreground">/MT</span></p><p className="mt-1 text-[10px] text-muted-foreground">Date: {date(latest.date)}</p>{delta != null && <div className={`mt-3 ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}><p className="text-xs font-semibold"><span aria-hidden="true">{trend === "up" ? "▲" : "▼"}</span> ${Math.abs(delta).toFixed(2)} ({Math.abs(percent ?? 0).toFixed(2)}%)</p><p className="mt-0.5 text-[10px] font-normal text-muted-foreground">vs 2-week avg</p></div>}<div className="mt-4 border-t border-border pt-3 text-left text-[10px] leading-tight text-muted-foreground"><div className="flex items-center justify-between gap-2 py-1"><span>Avg 2 Weeks</span><strong className="text-foreground">{avg != null ? `$${avg.toFixed(2)}` : "—"}</strong></div><div className="flex items-center justify-between gap-2 py-1"><span>Avg 4 Weeks</span><strong className="text-foreground">{averages?.fourWeeks.values[index.key] != null ? `$${averages.fourWeeks.values[index.key]!.toFixed(2)}` : "—"}</strong></div><div className="flex items-center justify-between gap-2 py-1"><span>Prev. Month</span><strong className="text-foreground">{averages?.month.values[index.key] != null ? `$${averages.month.values[index.key]!.toFixed(2)}` : "—"}</strong></div><p className="mt-2 text-center whitespace-nowrap">{rangeLabel(averages?.twoWeeks)}</p></div></div>;
        })}
      </div>
    </section>
  );
}

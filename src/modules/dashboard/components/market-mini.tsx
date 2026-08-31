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
  return window ? `${date(window.from)} - ${date(window.until)}` : "No history";
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
          return <div key={index.key} className="card p-3 text-black dark:text-white"><p className="text-eyebrow mb-1">{index.label}</p><p className="font-semibold text-sm">{price != null ? `$${price.toFixed(2)}` : "—"}</p><p className="text-[11px] text-muted-foreground mt-1">Date price: {date(latest.date)}</p>{delta != null && <p className={`text-xs mt-1 ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)} ({percent?.toFixed(2)}%) vs 2 weeks</p>}<div className="mt-2 space-y-1 text-[10px] text-muted-foreground"><p>2W avg: {avg != null ? `$${avg.toFixed(2)}` : "—"}<br />{rangeLabel(averages?.twoWeeks)}</p><p>4W avg: {averages?.fourWeeks.values[index.key] != null ? `$${averages.fourWeeks.values[index.key]!.toFixed(2)}` : "—"}<br />{rangeLabel(averages?.fourWeeks)}</p><p>Month avg: {averages?.month.values[index.key] != null ? `$${averages.month.values[index.key]!.toFixed(2)}` : "—"}<br />{rangeLabel(averages?.month)}</p></div></div>;
        })}
      </div>
    </section>
  );
}

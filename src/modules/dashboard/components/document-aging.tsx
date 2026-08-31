"use client";

import Link from "next/link";
import { usePendingAlerts } from "../hooks/use-dashboard";

const FALLBACK_CATEGORIES = [
  { type: "SI overdue (> H-10)", key: "SI overdue", link: "/shipment-monitor?tab=si" },
  { type: "Draft BL pending (> 3 days)", key: "Draft BL pending", link: "/shipment-monitor" },
  { type: "COO pending", key: "COO pending", link: "/shipment-monitor" },
  { type: "Invoice overdue", key: "Invoice overdue", link: "/outstanding-payment" },
  { type: "Surveyor report pending", key: "Surveyor report pending", link: "/quality" },
];

export function PendingAlerts() {
  const { data, isLoading, isError } = usePendingAlerts();
  const categories = data?.categories ?? FALLBACK_CATEGORIES.map((category) => ({ ...category, count: 0 }));
  return <section className="card h-full"><div className="card__body gap-3"><div className="flex items-center justify-between"><p className="text-base font-semibold">Pending Alerts</p><Link href="/shipment-monitor" className="link text-xs">View All →</Link></div>{isLoading ? <div className="space-y-3 animate-pulse">{FALLBACK_CATEGORIES.map((category) => <div key={category.key} className="h-8 bg-muted rounded" />)}</div> : isError ? <p className="text-sm text-red-600">Pending alerts unavailable.</p> : <div className="divide-y divide-border">{categories.map((category) => <Link key={category.key} href={category.link} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40"><span className="text-sm">{category.type}</span><span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${category.count > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>{category.count}</span></Link>)}</div>}</div></section>;
}

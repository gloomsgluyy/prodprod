"use client";

import { useState, Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMarketPriceList } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";

const KEYS = [
  "ici1", "ici2", "ici3", "ici4", "ici5", "newcastle",
  "hba", "hba1", "hba2", "hba3", "mgoUsd", "usdIdr",
] as const;

const LABELS: Record<typeof KEYS[number], string> = {
  ici1: "ICI 1",
  ici2: "ICI 2",
  ici3: "ICI 3",
  ici4: "ICI 4",
  ici5: "ICI 5",
  newcastle: "Newcastle",
  hba: "HBA",
  hba1: "HBA I",
  hba2: "HBA II",
  hba3: "HBA III",
  mgoUsd: "MGO",
  usdIdr: "USD/IDR",
};

function actorName(row: { action: string; user?: { name: string } | null }) {
  if (row.action === "scrape") return "Auto Scrape";
  return row.user?.name ?? "System";
}

function actionLabel(action: string) {
  if (action === "scrape") return "Auto Scrape";
  return action.charAt(0).toUpperCase() + action.slice(1).replace("_", " ");
}

function formatValue(key: typeof KEYS[number], value: number | null) {
  if (value == null) return "-";
  if (key === "usdIdr") return `Rp${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${Number(value).toFixed(2)}`;
}

export function PriceHistory() {
  const { listPage, setListPage } = useMarketPriceUIStore();
  const { data, isLoading } = useMarketPriceList(listPage);
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Price History</p>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table text-sm" aria-label="Market price history">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Action</th>
                    <th>By</th>
                    {KEYS.map((k) => <th key={k}>{LABELS[k]}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <Fragment key={row.id}>
                      <tr>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td>{new Date(row.createdAt).toLocaleTimeString()}</td>
                        <td><span className="badge badge--neutral badge--sm">{row.source}</span></td>
                        <td>{actionLabel(row.action)}</td>
                        <td>{actorName(row)}</td>
                        {KEYS.map((k) => (
                          <td key={k} className="font-mono text-xs">
                            {formatValue(k, (row as unknown as Record<typeof KEYS[number], number | null>)[k])}
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            className="button button--xs button--ghost button--neutral button--icon-only"
                            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                            aria-expanded={expanded === row.id}
                            aria-label={expanded === row.id ? "Collapse row" : "Expand row"}
                          >
                            {expanded === row.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {expanded === row.id && (
                        <tr key={`${row.id}-detail`}>
                          <td colSpan={18} className="bg-surface">
                            <div className="p-3 text-xs text-muted-foreground font-mono">
                              ID: {row.id} | Created: {new Date(row.createdAt).toLocaleString()}
                              {row.notes ? ` | Notes: ${row.notes}` : ""}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={18} className="text-center text-muted-foreground py-8">
                        No market price history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {meta.total} entries | Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1}
                    onClick={() => setListPage(meta.page - 1)}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setListPage(meta.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

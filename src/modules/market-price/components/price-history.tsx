"use client";

import { useState, Fragment } from "react";
import { useMarketPriceList } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";

const KEYS = ["ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3"] as const;
const LABELS: Record<typeof KEYS[number], string> = {
  ici1: "ICI 1", ici2: "ICI 2", ici3: "ICI 3", ici4: "ICI 4", ici5: "ICI 5",
  newcastle: "Newcastle", hba: "HBA", hba1: "HBA I", hba2: "HBA II", hba3: "HBA III",
};

export function PriceHistory() {
  const { listPage, setListPage } = useMarketPriceUIStore();
  const { data, isLoading } = useMarketPriceList(listPage);
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = data?.data ?? [];
  const meta  = data?.meta;

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
                    <th>Date</th><th>Source</th><th>By</th>
                    {KEYS.map((k) => <th key={k}>{LABELS[k]}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <Fragment key={row.id}>
                      <tr>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td><span className="badge badge--neutral badge--sm">{row.source}</span></td>
                        <td>{(row as { user?: { name: string } }).user?.name ?? "—"}</td>
                        {KEYS.map((k) => (
                          <td key={k} className="font-mono text-xs">
                            {(row as unknown as Record<string, number | null>)[k] != null
                              ? `$${Number((row as unknown as Record<string, number | null>)[k]).toFixed(2)}`
                              : "—"}
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            className="button button--xs button--ghost button--neutral"
                            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                            aria-expanded={expanded === row.id}
                          >
                            {expanded === row.id ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>
                      {expanded === row.id && (
                        <tr key={`${row.id}-detail`}>
                          <td colSpan={14} className="bg-surface">
                            <div className="p-3 text-xs text-muted-foreground font-mono">
                              ID: {row.id} · Action: {row.action} ·
                              Created: {new Date(row.createdAt).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {meta.total} entries · Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page <= 1} onClick={() => setListPage(meta.page - 1)}>
                    ←
                  </button>
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page >= meta.totalPages} onClick={() => setListPage(meta.page + 1)}>
                    →
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

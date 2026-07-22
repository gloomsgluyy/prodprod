"use client";

import { useStockInventory } from "../hooks/use-dashboard";

export function StockInventory() {
  const { data, isLoading } = useStockInventory();
  const stock = data?.data;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Stock Inventory</p>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-7 bg-muted rounded w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-3xl font-light">
              {stock ? (stock.totalMt / 1000).toFixed(1) : "—"}
              <span className="text-base text-muted-foreground ml-1">K MT</span>
            </p>
            <ul className="flex flex-col gap-1.5 mt-1">
              {stock?.top.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground max-w-40">{s.supplierName}</span>
                  <span className="font-medium">{(s.stockAvailable / 1000).toFixed(1)}K MT</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

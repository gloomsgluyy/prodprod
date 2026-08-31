"use client";

import { useStockInventory } from "../hooks/use-dashboard";

export function StockInventory() {
  const { data, isLoading } = useStockInventory();
  const stock = data?.data;

  return (
    <div className="card h-full">
      <div className="card__body gap-4">
        <p className="text-base font-semibold">Stock Inventory</p>

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
            <p className="text-eyebrow">Total Stock</p>
            <p className="text-3xl font-light">
              {stock ? stock.totalMt.toLocaleString() : "—"}
              <span className="text-base text-muted-foreground ml-1">MT</span>
            </p>
            <div className="overflow-x-auto"><table className="table text-sm w-full"><thead><tr><th className="text-left">Source / Location</th><th className="text-right">Stock (MT)</th></tr></thead><tbody>{stock?.top.map((s) => <tr key={s.id}><td className="truncate max-w-32">{s.supplierName}</td><td className="text-right font-medium whitespace-nowrap">{s.stockAvailable.toLocaleString()}</td></tr>)}</tbody></table></div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useVolumeData } from "../hooks/use-dashboard";
import { useDashboardUIStore } from "../store/dashboard-ui-store";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-gray-400",
  loading: "bg-blue-500",
  in_transit: "bg-indigo-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

export function VolumeCard() {
  const { volumeYear, volumeSegment, volumeExpanded, setVolumeYear, setVolumeSegment, toggleVolumeExpanded } = useDashboardUIStore();
  const { data, isLoading } = useVolumeData(volumeYear, volumeSegment);
  const vol = data?.data;

  const totalK = vol ? (vol.total / 1000).toFixed(1) : "—";

  return (
    <div className="card h-full">
      <div className="card__body gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-eyebrow">Total Volume</p>
            <p className="text-4xl font-light mt-1">
              {isLoading ? <span className="animate-pulse">…</span> : totalK}
              <span className="text-base text-muted-foreground ml-1">K MT</span>
            </p>
          </div>
          <button
            type="button"
            className="button button--sm button--ghost button--neutral"
            onClick={toggleVolumeExpanded}
            aria-expanded={volumeExpanded}
          >
            {volumeExpanded ? "Hide Detail" : "Show Detail"}
          </button>
        </div>

        {volumeExpanded && (
          <>
            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="select select--sm"
                value={volumeYear}
                onChange={(e) => setVolumeYear(Number(e.target.value))}
                aria-label="Select year"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="flex gap-1">
                {(["total", "local", "export"] as const).map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    className={`button button--sm ${volumeSegment === seg ? "button--primary" : "button--ghost button--neutral"}`}
                    onClick={() => setVolumeSegment(seg)}
                    aria-pressed={volumeSegment === seg}
                  >
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status breakdown */}
            {vol && (
              <div className="flex flex-col gap-2">
                {Object.entries(vol.byStatus).map(([status, qty]) => {
                  const pct = vol.total > 0 ? (qty / vol.total) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="capitalize">{status.replace("_", " ")}</span>
                        <span>{(qty / 1000).toFixed(1)}K MT ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[status] ?? "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

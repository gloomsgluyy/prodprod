"use client";

import { useDashboardUIStore } from "../store/dashboard-ui-store";

const STATUS_OPTIONS = ["all", "upcoming", "loading", "in_transit", "completed", "cancelled"];
const TYPE_OPTIONS = ["all", "export", "domestic"];
const COUNTRY_OPTIONS = ["all", "China", "India", "Japan", "South Korea", "Taiwan", "Vietnam", "Thailand", "Malaysia", "Philippines"];
const REGION_OPTIONS = ["all", "Asia Pacific", "Europe", "Middle East", "Americas"];
const TIME_CHIPS = [
  { label: "Last 30 Days", value: "last_30" },
  { label: "Last 90 Days", value: "last_90" },
  { label: "Year to Date", value: "ytd" },
  { label: "All Time", value: "all" },
  { label: "Custom", value: "custom" },
];

export function FilterBar() {
  const { filters, setFilter } = useDashboardUIStore();

  return (
    <div className="card card__body grid grid-cols-2 gap-x-3 gap-y-2 p-3 h-full content-center">
      {/* Search */}
      <div className="input-group col-span-2 min-w-0">
        <span className="input-group__text">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11.5" cy="11.5" r="9.5" />
              <path strokeLinecap="round" d="M18.5 18.5L22 22" />
            </g>
          </svg>
        </span>
        <input
          type="search"
          className="input"
          placeholder="Search buyer, vessel, project…"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          aria-label="Search shipments"
        />
      </div>

      {/* Country */}
      <div className="field min-w-0 gap-1">
        <label className="field__label text-xs" htmlFor="filter-country">Country</label>
        <select
          id="filter-country"
          className="select"
          value={filters.country}
          onChange={(e) => setFilter("country", e.target.value)}
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Countries" : c}</option>
          ))}
        </select>
      </div>

      {/* Region */}
      <div className="field min-w-0 gap-1">
        <label className="field__label text-xs" htmlFor="filter-region">Region</label>
        <select
          id="filter-region"
          className="select"
          value={filters.region}
          onChange={(e) => setFilter("region", e.target.value)}
        >
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>{r === "all" ? "All Regions" : r}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="field min-w-0 gap-1">
        <label className="field__label text-xs" htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          className="select"
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Status" : s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Market Type */}
      <div className="field min-w-0 gap-1">
        <label className="field__label text-xs" htmlFor="filter-type">Market Type</label>
        <select
          id="filter-type"
          className="select"
          value={filters.marketType}
          onChange={(e) => setFilter("marketType", e.target.value)}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Time Range chips */}
      <div className="field col-span-2 gap-1">
        <span className="field__label text-xs">Time Range</span>
        <div className="flex flex-wrap gap-1">
          {TIME_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={`badge cursor-pointer ${filters.timeRange === chip.value ? "badge--primary" : "badge--neutral"}`}
              onClick={() => setFilter("timeRange", chip.value)}
              aria-pressed={filters.timeRange === chip.value}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {filters.timeRange === "custom" && (
        <div className="flex gap-2 items-end">
          <div className="field">
            <label className="field__label text-xs" htmlFor="filter-start">From</label>
            <input
              id="filter-start"
              type="date"
              className="input"
              value={filters.customStart}
              onChange={(e) => setFilter("customStart", e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label text-xs" htmlFor="filter-end">To</label>
            <input
              id="filter-end"
              type="date"
              className="input"
              value={filters.customEnd}
              min={filters.customStart || undefined}
              onChange={(e) => setFilter("customEnd", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

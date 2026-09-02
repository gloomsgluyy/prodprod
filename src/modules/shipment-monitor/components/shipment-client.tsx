"use client";

import { useShipmentUIStore } from "../store/shipment-ui-store";
import { useShipmentList } from "../hooks/use-shipments";
import { ShipmentTable }         from "./shipment-table";
import { ShipmentDetailDrawer }  from "./shipment-detail-drawer";
import { CloseModal }            from "./close-modal";
import { DailyDeliveryTab }      from "./daily-delivery-tab";

type StatusTab = "all"|"upcoming"|"loading"|"in_transit"|"completed"|"cancelled"|"daily_delivery";

const TABS: { key: StatusTab; label: string }[] = [
  { key: "all",            label: "All" },
  { key: "upcoming",       label: "Upcoming" },
  { key: "loading",        label: "Loading" },
  { key: "in_transit",     label: "In Transit" },
  { key: "completed",      label: "Completed" },
  { key: "cancelled",      label: "Cancelled" },
  { key: "daily_delivery", label: "Daily Delivery" },
];

const STATUS_COLORS: Record<string, string> = {
  all:        "text-foreground",
  upcoming:   "text-neutral-500",
  loading:    "text-blue-500",
  in_transit: "text-indigo-500",
  completed:  "text-emerald-500",
  cancelled:  "text-red-500",
};

function SummaryCards() {
  const { filterSearch, filterRegion, filterYear } = useShipmentUIStore();

  // Fetch per-status counts (small queries, cached)
  const statuses: StatusTab[] = ["upcoming", "loading", "in_transit", "completed", "cancelled"];
  const queries = statuses.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useShipmentList({ page: 1, pageSize: 1, status: s, search: filterSearch || undefined, region: filterRegion || undefined, year: filterYear || undefined })
  );

  const labels: Record<string, string> = {
    upcoming: "Upcoming", loading: "Loading", in_transit: "In Transit",
    completed: "Completed", cancelled: "Cancelled",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {statuses.map((s, i) => (
        <div key={s} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{labels[s]}</p>
            <p className={`text-2xl font-light ${STATUS_COLORS[s]}`}>
              {queries[i].isLoading ? <span className="animate-pulse">…</span> : queries[i].data?.meta?.total ?? 0}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function ShipmentClient() {
  const searchParams = useSearchParams();
  const initRef = useRef(false);
  const {
    activeTab, filterSearch, filterRegion, filterYear,
    detailId, closeModalId,
    setActiveTab, setFilterSearch, setFilterRegion, setFilterYear, openDetail
  } = useShipmentUIStore();

  useEffect(() => {
    if (initRef.current) return;
    const openId = searchParams.get("open");
    if (openId) {
      openDetail(openId);
      initRef.current = true;
    }
  }, [searchParams, openDetail]);

  const currentYear = String(new Date().getFullYear());
  const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <SummaryCards />

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border border-border rounded-lg p-1 bg-surface">
        {TABS.map((tab) => (
          <button key={tab.key} type="button"
            className={`button button--sm flex-shrink-0 ${activeTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "daily_delivery" ? (
        <DailyDeliveryTab />
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="input-group flex-1 min-w-48">
              <span className="input-group__text">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11.5" cy="11.5" r="9.5" />
                    <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                  </g>
                </svg>
              </span>
              <input type="search" className="input" placeholder="Search buyer, vessel, barge, shipment no…"
                value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
                aria-label="Search shipments" />
            </div>

            <input type="text" className="input w-36" placeholder="Region"
              value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              aria-label="Filter by region" />

            <select className="select select--sm w-28" value={filterYear || "all"}
              onChange={(e) => setFilterYear(e.target.value === "all" ? "" : e.target.value)}
              aria-label="Filter by year">
              <option value="all">All Years</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

          </div>

          <ShipmentTable />
        </>
      )}

      {/* Overlays */}
      {detailId                        && <ShipmentDetailDrawer />}
      {closeModalId                    && <CloseModal />}
    </div>
  );
}

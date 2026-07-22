"use client";

import { useShipmentUIStore } from "../store/shipment-ui-store";
import { useShipmentDetail } from "../hooks/use-shipments";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { TabInfo }          from "./tabs/tab-info";
import { TabDocuments }     from "./tabs/tab-documents";
import { TabSourceBarge }   from "./tabs/tab-source-barge";
import { TabIssues }        from "./tabs/tab-issues";
import { TabDomestic }      from "./tabs/tab-domestic";
import { TabFinancial }     from "./tabs/tab-financial";
import { TabSI }            from "./tabs/tab-si";
import { TabCommercialRef } from "./tabs/tab-commercial-ref";

type DetailTab = "info"|"documents"|"source_barge"|"issues"|"domestic"|"financial"|"si"|"commercial_ref";

const TABS: { key: DetailTab; label: string; execOnly?: boolean }[] = [
  { key: "info",           label: "Info" },
  { key: "commercial_ref", label: "Commercial Ref" },
  { key: "documents",      label: "Documents" },
  { key: "source_barge",   label: "Source & Barge" },
  { key: "issues",         label: "Issues" },
  { key: "domestic",       label: "Domestic" },
  { key: "financial",      label: "Financial", execOnly: true },
  { key: "si",             label: "SI" },
];

const STATUS_BADGE: Record<string, string> = {
  upcoming:   "badge--neutral",
  loading:    "badge--primary",
  in_transit: "badge--info",
  completed:  "badge--success",
  cancelled:  "badge--danger",
};

function TabContent({ tab }: { tab: DetailTab }) {
  switch (tab) {
    case "info":           return <TabInfo />;
    case "commercial_ref": return <TabCommercialRef />;
    case "documents":      return <TabDocuments />;
    case "source_barge":   return <TabSourceBarge />;
    case "issues":         return <TabIssues />;
    case "domestic":       return <TabDomestic />;
    case "financial":      return <TabFinancial />;
    case "si":             return <TabSI />;
    default:               return null;
  }
}

import { useEffect } from "react";

export function ShipmentDetailDrawer() {
  const { detailId, detailTab, closeDetail, setDetailTab } = useShipmentUIStore();
  const { isExecutive } = useAuthStore();
  const { data, isLoading } = useShipmentDetail(detailId ?? "");
  const shipment = data?.data;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDetail]);

  if (!detailId) return null;

  const visibleTabs = TABS.filter((t) => !t.execOnly || isExecutive);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-label="Shipment detail" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button type="button" className="absolute inset-0 w-full bg-background/50 backdrop-blur-sm"
        onClick={closeDetail} aria-label="Close drawer" tabIndex={-1} />

      <aside className="relative bg-surface w-full max-w-3xl h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            {isLoading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-5 w-48 bg-muted rounded"></div>
                <div className="h-3 w-64 bg-muted/50 rounded"></div>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-base leading-tight">
                  {shipment?.shipmentNumber ?? "Unknown Shipment"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {shipment?.buyer}
                  {shipment?.buyerCountry && ` · ${shipment.buyerCountry}`}
                  {shipment?.vesselName && ` · ${shipment.vesselName}`}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isLoading ? (
                <div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div>
              ) : shipment ? (
                <span className={`badge ${STATUS_BADGE[shipment.status] ?? "badge--neutral"}`}>
                  {shipment.status.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
                </span>
              ) : null}
              <button type="button" className="button button--ghost button--neutral button--icon-only"
                onClick={closeDetail} aria-label="Close drawer">✕</button>
            </div>
          </div>

          {/* Sub-tab bar */}
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button key={tab.key} type="button"
                className={`button button--sm flex-shrink-0 ${detailTab === tab.key ? "button--primary" : "button--ghost button--neutral"}`}
                onClick={() => setDetailTab(tab.key)}
                aria-pressed={detailTab === tab.key}
                aria-current={detailTab === tab.key ? "true" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TabContent tab={detailTab} />
        </div>
      </aside>
    </div>
  );
}

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { FilterBar }        from "@/modules/dashboard/components/filter-bar";
import { MetricCards }      from "@/modules/dashboard/components/metric-cards";
import { MarketMini }       from "@/modules/dashboard/components/market-mini";
import { VolumeCard }       from "@/modules/dashboard/components/volume-card";
import { MonthlyChart }     from "@/modules/dashboard/components/monthly-chart";
import { PriorityTasks }    from "@/modules/dashboard/components/priority-tasks";
import { UpcomingMeetings } from "@/modules/dashboard/components/upcoming-meetings";
import { StockInventory }   from "@/modules/dashboard/components/stock-inventory";
import { ShipmentsTable }   from "@/modules/dashboard/components/shipments-table";
import { ApprovalPending }  from "@/modules/dashboard/components/approval-pending";
import { PendingAlerts }    from "@/modules/dashboard/components/document-aging";

export const metadata = { title: "Dashboard · CoalTrade OS" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const executive = isExecutive(session?.user?.role ?? "");

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page header */}
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Dashboard <span className="text-muted-foreground font-normal text-base">— Command Center</span>
        </h1>
      </div>

      {/* Market reference is the dashboard's primary decision input. */}
      <section aria-label="Market prices">
        <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-lg" />}>
          <MarketMini />
        </Suspense>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-end">
        <FilterBar />
        <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-lg" />}><MetricCards /></Suspense>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)] gap-6 items-stretch"><Suspense fallback={<div className="h-80 animate-pulse bg-muted rounded-lg" />}><StockInventory /></Suspense><Suspense fallback={<div className="h-80 animate-pulse bg-muted rounded-lg" />}><ShipmentsTable /></Suspense></div>

      {/* [6+7] Priority Tasks + Upcoming Meetings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-lg" />}>
          <PriorityTasks />
        </Suspense>
        <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-lg" />}>
          <UpcomingMeetings />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-28 animate-pulse bg-muted rounded-lg" />}><VolumeCard /></Suspense>

      {/* [10] Waiting Approval (hidden when empty) */}
      <Suspense fallback={null}>
        <ApprovalPending />
      </Suspense>

      {/* Pending operational alerts replace the legacy Blocker Control Tower. */}
      <Suspense fallback={<div className="h-28 animate-pulse bg-muted rounded-lg" />}>
        <PendingAlerts />
      </Suspense>

      {/* [13+14] Executive-only panels — rendered server-side, no flash */}
      {executive && (
        <Suspense fallback={null}>
          {/* AI Urgency + User Activity loaded lazily client-side in their widgets */}
          <ExecutivePanels />
        </Suspense>
      )}
    </div>
  );
}

// Lazy-loaded only for executives — dynamic import keeps it out of non-exec bundles
async function ExecutivePanels() {
  const { default: ExecPanelsClient } = await import(
    "@/modules/dashboard/components/executive-panels"
  );
  return <ExecPanelsClient />;
}

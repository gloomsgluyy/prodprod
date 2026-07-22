"use client";

import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentDetail } from "../../hooks/use-shipments";

// 5 tracks per SRS FR-SHIP-010
const TRACKS: Record<string, { label: string; stages: string[] }> = {
  SKAB:    { label: "SKAB",    stages: ["Supplier", "Operation", "Traffic", "Finance"] },
  DSR:     { label: "DSR",     stages: ["Supplier", "Operation", "Traffic"] },
  BL_CM:   { label: "BL / CM", stages: ["Operation", "Traffic", "Finance"] },
  COA_POL: { label: "COA POL", stages: ["Surveyor", "Traffic", "Finance"] },
  COA_POD: { label: "COA POD", stages: ["Quality", "Finance", "Vendor", "Approval DT", "Paid"] },
};

interface Stage { stage: string; party?: string; receivedAt?: string | null; sentAt?: string | null; }

function TrackPipeline({ track, stages: rawStages }: { track: string; stages: Stage[] }) {
  const config = TRACKS[track];
  if (!config) return null;

  const stageMap = Object.fromEntries((rawStages ?? []).map((s) => [s.stage, s]));

  const stuckAt = config.stages.find((stageName) => {
    const s = stageMap[stageName];
    if (!s) return true; // not received yet
    if (!s.sentAt && stageName !== config.stages[config.stages.length - 1]) return true;
    return false;
  });

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-sm">{config.label}</p>
        {stuckAt && (
          <span className="badge badge--warning badge--sm">Stuck at: {stuckAt}</span>
        )}
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {config.stages.map((stageName, idx) => {
          const s = stageMap[stageName];
          const received = !!s?.receivedAt;
          const sent     = !!s?.sentAt;
          const isLast   = idx === config.stages.length - 1;
          const stuck    = stageName === stuckAt;

          return (
            <div key={stageName} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-xs min-w-20 text-center border ${
                isLast && sent ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800" :
                stuck ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800" :
                received ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" :
                "bg-surface border-border"
              }`}>
                <span className="font-medium">{stageName}</span>
                {received && <span className="text-muted-foreground" title={`Received: ${s?.receivedAt}`}>
                  ↓ {s?.receivedAt ? new Date(s.receivedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) : ""}
                </span>}
                {sent && !isLast && <span className="text-muted-foreground" title={`Sent: ${s?.sentAt}`}>
                  ↑ {s?.sentAt ? new Date(s.sentAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) : ""}
                </span>}
              </div>
              {idx < config.stages.length - 1 && (
                <span className={`text-lg ${sent ? "text-blue-400" : "text-muted-foreground"}`}>→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TabDomestic() {
  const { detailId } = useShipmentUIStore();
  const { data, isLoading } = useShipmentDetail(detailId ?? "");
  const shipment = data?.data;

  if (shipment?.type !== "domestic") {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Domestic handover tracking is only applicable for domestic shipments.
      </div>
    );
  }

  if (isLoading) return <div className="p-4 space-y-3 animate-pulse">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded" />)}</div>;

  const handovers = shipment?.domHandover ?? [];
  const handoverMap = Object.fromEntries(handovers.map((h) => [h.track, h.stages as Stage[]]));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <p className="text-eyebrow">Document Handover Tracking</p>
        <span className="badge badge--neutral badge--sm">5 tracks</span>
      </div>
      <p className="text-xs text-muted-foreground">Each track shows who currently holds the document. Stuck indicator = party that has not forwarded.</p>
      {Object.keys(TRACKS).map((track) => (
        <TrackPipeline key={track} track={track} stages={handoverMap[track] ?? []} />
      ))}
    </div>
  );
}

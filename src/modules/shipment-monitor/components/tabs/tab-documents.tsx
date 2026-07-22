"use client";

import { useState } from "react";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import { useShipmentDocuments, useUpdateDocument } from "../../hooks/use-shipments";

const STATUS_OPTS = ["pending","received","submitted","completed","not_required"] as const;
const STATUS_BADGE: Record<string, string> = {
  pending:      "badge--neutral",
  received:     "badge--warning",
  submitted:    "badge--info",
  completed:    "badge--success",
  not_required: "badge--neutral",
};

interface DocRowProps {
  doc: ReturnType<typeof useShipmentDocuments>["data"] extends { data: (infer D)[] } | undefined ? D : never;
  shipmentId: string;
}

function DocRow({ doc, shipmentId }: DocRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: update, isPending } = useUpdateDocument(shipmentId);

  const agingColor = doc.agingDays == null ? "" :
    doc.agingDays > 30 ? "text-red-500 font-semibold" :
    doc.agingDays > 15 ? "text-amber-500" : "";

  return (
    <>
      <tr className={doc.status === "completed" ? "opacity-60" : ""}>
        <td className="font-mono text-xs">{doc.requirementCode.toUpperCase()}</td>
        <td className="text-sm">{doc.label}</td>
        <td>
          <select
            className="select select--sm"
            value={doc.status}
            disabled={isPending}
            onChange={(e) => update({ requirementCode: doc.requirementCode, status: e.target.value as never })}
            aria-label={`Status for ${doc.label}`}
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g," ")}</option>
            ))}
          </select>
        </td>
        <td>{doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() : "—"}</td>
        <td>
          {doc.agingDays != null ? (
            <span className={`text-xs ${agingColor}`}>{doc.agingDays}d</span>
          ) : "—"}
        </td>
        <td className="text-xs">{doc.pic ?? "—"}</td>
        <td>
          {doc.fileUrl ? (
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
              className="button button--xs button--ghost button--primary">View ↗</a>
          ) : (
            <span className="text-xs text-muted-foreground">No file</span>
          )}
        </td>
        <td>
          <button type="button"
            className="button button--xs button--ghost button--neutral"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-surface px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-eyebrow mb-1">Received Date</p>
                <input type="date" className="input input--sm"
                  defaultValue={doc.receivedDate?.split("T")[0] ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, receivedDate: e.target.value || null })}
                  aria-label="Received date" />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Submitted Date</p>
                <input type="date" className="input input--sm"
                  defaultValue={doc.submittedDate?.split("T")[0] ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, submittedDate: e.target.value || null })}
                  aria-label="Submitted date" />
              </div>
              <div>
                <p className="text-eyebrow mb-1">PIC</p>
                <input type="text" className="input input--sm" defaultValue={doc.pic ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, pic: e.target.value })}
                  aria-label="PIC name" />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Owner</p>
                <input type="text" className="input input--sm" defaultValue={doc.owner ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, owner: e.target.value })}
                  aria-label="Owner" />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Hardcopy Status</p>
                <input type="text" className="input input--sm" defaultValue={doc.hardcopyStatus ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, hardcopyStatus: e.target.value })}
                  aria-label="Hardcopy status" />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Submitted To</p>
                <input type="text" className="input input--sm" defaultValue={doc.submittedTo ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, submittedTo: e.target.value })}
                  aria-label="Submitted to" />
              </div>
              <div className="col-span-2">
                <p className="text-eyebrow mb-1">Notes</p>
                <input type="text" className="input input--sm" defaultValue={doc.notes ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, notes: e.target.value })}
                  aria-label="Notes" />
              </div>
              <div className="col-span-2">
                <p className="text-eyebrow mb-1">File URL (paste link)</p>
                <input type="url" className="input input--sm" defaultValue={doc.fileUrl ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, fileUrl: e.target.value || null, fileName: e.target.value.split("/").pop() ?? "" })}
                  placeholder="https://..."
                  aria-label="File URL" />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function TabDocuments() {
  const { detailId } = useShipmentUIStore();
  const { data, isLoading } = useShipmentDocuments(detailId ?? "");
  const docs = data?.data ?? [];

  const completed  = docs.filter((d) => d.status === "completed").length;
  const critical   = docs.filter((d) => d.agingDays != null && d.agingDays > 30).length;
  const warning    = docs.filter((d) => d.agingDays != null && d.agingDays > 15 && d.agingDays <= 30).length;

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="badge badge--success">{completed}/{docs.length} completed</span>
        {critical > 0 && <span className="badge badge--danger">{critical} critical aging (&gt;30d)</span>}
        {warning  > 0 && <span className="badge badge--warning">{warning} warning aging (15-30d)</span>}
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">{Array.from({ length: 11 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table text-sm w-full" aria-label="Document checklist">
            <thead>
              <tr>
                <th className="w-8">Code</th>
                <th>Document</th>
                <th className="w-36">Status</th>
                <th>Received</th>
                <th>Aging</th>
                <th>PIC</th>
                <th>File</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocRow key={doc.id} doc={doc} shipmentId={detailId!} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

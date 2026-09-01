"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSourceList } from "@/modules/sources/hooks/use-sources";

interface CargoRow {
  id:       number;
  name:     string;
  quantity: number;
  gar:      number;
  ts:       number;
  ash:      number;
  tm:       number;
}

interface BlendResult {
  totalQty: number;
  gar: number | null; nar: number | null; ts: number | null; ash: number | null;
  tm:  number | null; im:  number | null; hgi: number | null;
}

interface Comparison {
  gar: { target: number; result: number; delta: number } | null;
  ts:  { target: number; result: number; delta: number } | null;
  ash: { target: number; result: number; delta: number } | null;
  tm:  { target: number; result: number; delta: number } | null;
}

let nextId = 3;

const DEFAULT_ROWS: CargoRow[] = [
  { id: 1, name: "Cargo A", quantity: 30000, gar: 5200, ts: 0.5, ash: 7, tm: 30 },
  { id: 2, name: "Cargo B", quantity: 20000, gar: 4200, ts: 0.8, tm: 35, ash: 9 },
];

// ── Live preview calculator ────────────────────────────────────────────────────
function liveCalc(rows: CargoRow[]): BlendResult {
  const valid   = rows.filter((r) => r.quantity > 0);
  const totalQty= valid.reduce((s, r) => s + r.quantity, 0);
  if (totalQty === 0) return { totalQty: 0, gar: null, nar: null, ts: null, ash: null, tm: null, im: null, hgi: null };

  const wa = (key: keyof CargoRow) => {
    const hasData = valid.some((r) => (r[key] as number) > 0);
    if (!hasData) return null;
    return Math.round(valid.reduce((s, r) => s + ((r[key] as number) || 0) * r.quantity, 0) / totalQty * 100) / 100;
  };

  return {
    totalQty,
    gar: wa("gar"), nar: null, ts: wa("ts"), ash: wa("ash"), tm: wa("tm"),
    im: null, hgi: null,
  };
}

// ── History list ───────────────────────────────────────────────────────────────
function HistoryPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["blending", "history", page],
    queryFn: () => api.get<{ data: { id: string; name: string; cargos: unknown; result: unknown; createdAt: string }[]; meta: { total: number; totalPages: number; page: number } }>(`/api/blending/history?page=${page}`),
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Simulation History</p>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved simulations yet</p>
        ) : (
          <>
            {items.map((sim) => {
              const result = sim.result as BlendResult;
              const cargos = sim.cargos as CargoRow[];
              return (
                <div key={sim.id} className="p-3 rounded-lg border border-border text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{sim.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sim.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cargos?.length ?? 0} cargoes · {Number(result?.totalQty ?? 0).toLocaleString()} MT
                    {result?.gar && ` · GAR: ${result.gar}`}
                    {result?.ts  && ` · TS: ${result.ts}%`}
                  </p>
                </div>
              );
            })}
            {meta && meta.totalPages > 1 && (
              <div className="flex gap-1 justify-end">
                <button type="button" className="button button--sm button--ghost button--neutral"
                  disabled={meta.page <= 1} onClick={() => setPage(p=>p-1)}>←</button>
                <button type="button" className="button button--sm button--ghost button--neutral"
                  disabled={meta.page >= meta.totalPages} onClick={() => setPage(p=>p+1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main client ────────────────────────────────────────────────────────────────
export function BlendingClient() {
  const [rows, setRows]         = useState<CargoRow[]>(DEFAULT_ROWS);
  const [targetGar, setTargetGar]= useState("");
  const [targetTs,  setTargetTs] = useState("");
  const [targetAsh, setTargetAsh]= useState("");
  const [targetTm,  setTargetTm] = useState("");
  const [simResult, setSimResult]= useState<{ result: BlendResult; comparison: Comparison | null } | null>(null);
  const [saveName,  setSaveName] = useState("");

  // Load-from-source dropdown
  const { data: sourcesData } = useSourceList({ page: 1, pageSize: 100 });
  const sources = sourcesData?.data ?? [];

  const live = liveCalc(rows);

  const { mutate: simulate, isPending } = useMutation({
    mutationFn: (save: boolean) => api.post<{ data: { result: BlendResult; comparison: Comparison | null } }>("/api/blending/simulate", {
      cargoes: rows,
      targetSpec: {
        gar: targetGar ? Number(targetGar) : undefined,
        ts:  targetTs  ? Number(targetTs)  : undefined,
        ash: targetAsh ? Number(targetAsh) : undefined,
        tm:  targetTm  ? Number(targetTm)  : undefined,
      },
      save,
      name: saveName || undefined,
    }),
    onSuccess: (res) => setSimResult(res.data),
  });

  const updateRow = useCallback((id: number, key: keyof CargoRow, value: string | number) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [key]: key === "name" ? String(value) : Number(value) || 0 } : r));
  }, []);

  const addRow = useCallback(() => {
    const n = nextId++;
    setRows((prev) => [...prev, { id: n, name: `Cargo ${String.fromCharCode(64 + n)}`, quantity: 20000, gar: 5000, ts: 0.6, ash: 8, tm: 32 }]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const loadFromSource = useCallback((rowId: number, sourceId: string) => {
    const src = sources.find((s) => s.id === sourceId);
    if (!src) return;
    setRows((prev) => prev.map((r) => r.id === rowId ? {
      ...r,
      name: src.name,
      gar:  src.specGar ?? r.gar,
      ts:   src.specTs  ?? r.ts,
      ash:  src.specAsh ?? r.ash,
      tm:   src.specTm  ?? r.tm,
    } : r));
  }, [sources]);

  const PARAMS: { key: keyof BlendResult; label: string }[] = [
    { key: "totalQty", label: "Total Qty (MT)" },
    { key: "gar",  label: "GAR (kcal/kg)" },
    { key: "ts",   label: "TS (%)" },
    { key: "ash",  label: "ASH (%)" },
    { key: "tm",   label: "TM (%)" },
  ];

  const deltaColor = (delta: number | null | undefined, param: string) => {
    if (delta == null) return "";
    const higher = param === "gar";
    if (higher) return delta >= 0 ? "text-emerald-500" : "text-red-500";
    return delta <= 0 ? "text-emerald-500" : "text-red-500";
  };

  const handleExport = () => {
    if (!simResult) return;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      simulationName: saveName || "Blending Simulation",
      cargoes: rows.map(r => ({
        name: r.name,
        quantity: r.quantity,
        gar: r.gar,
        ts: r.ts,
        ash: r.ash,
        tm: r.tm,
      })),
      targetSpec: {
        gar: targetGar ? Number(targetGar) : null,
        ts: targetTs ? Number(targetTs) : null,
        ash: targetAsh ? Number(targetAsh) : null,
        tm: targetTm ? Number(targetTm) : null,
      },
      result: simResult.result,
      comparison: simResult.comparison,
    };

    const csvLines = [
      "Blending Simulation Report",
      `Generated: ${new Date().toLocaleString()}`,
      `Simulation Name: ${saveName || "Blending Simulation"}`,
      "",
      "=== CARGOES ===",
      "Name,Quantity (MT),GAR (kcal/kg),TS (%),ASH (%),TM (%)",
      ...rows.map(r => `${r.name},${r.quantity},${r.gar},${r.ts},${r.ash},${r.tm}`),
      "",
      "=== TARGET SPEC ===",
      `GAR,${targetGar || "N/A"}`,
      `TS,${targetTs || "N/A"}`,
      `ASH,${targetAsh || "N/A"}`,
      `TM,${targetTm || "N/A"}`,
      "",
      "=== BLENDED RESULT ===",
      `Total Quantity (MT),${simResult.result.totalQty}`,
      `GAR (kcal/kg),${simResult.result.gar ?? "N/A"}`,
      `TS (%),${simResult.result.ts ?? "N/A"}`,
      `ASH (%),${simResult.result.ash ?? "N/A"}`,
      `TM (%),${simResult.result.tm ?? "N/A"}`,
    ];

    if (simResult.comparison) {
      csvLines.push("", "=== COMPARISON ===");
      Object.entries(simResult.comparison).forEach(([key, val]) => {
        if (val) csvLines.push(`${key.toUpperCase()},Target: ${val.target},Result: ${val.result},Delta: ${val.delta}`);
      });
    }

    const csv = csvLines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blending-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: input + controls */}
      <div className="xl:col-span-2 flex flex-col gap-5">
        {/* Cargo input table */}
        <div className="card">
          <div className="card__body gap-3">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">Cargo Input</p>
              <button type="button" className="button button--sm button--ghost button--primary" onClick={addRow}>+ Add Cargo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Cargo</th><th>Load from Source</th><th>Qty (MT)</th>
                    <th>GAR</th><th>TS %</th><th>ASH %</th><th>TM %</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input type="text" className="input input--sm w-28" value={row.name}
                          onChange={(e) => updateRow(row.id, "name", e.target.value)}
                          aria-label={`Cargo name ${row.id}`} />
                      </td>
                      <td>
                        <select className="select select--sm w-40"
                          onChange={(e) => loadFromSource(row.id, e.target.value)}
                          aria-label="Load from source">
                          <option value="">— pick source —</option>
                          {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      {(["quantity","gar","ts","ash","tm"] as const).map((key) => (
                        <td key={key}>
                          <input type="number" step="0.01" className="input input--sm w-20"
                            value={row[key]} onChange={(e) => updateRow(row.id, key, e.target.value)}
                            aria-label={`${key} for ${row.name}`} />
                        </td>
                      ))}
                      <td>
                        {rows.length > 2 && (
                          <button type="button" className="button button--xs button--ghost button--danger"
                            onClick={() => removeRow(row.id)} aria-label={`Remove ${row.name}`}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Target spec */}
        <div className="card">
          <div className="card__body gap-3">
            <p className="text-eyebrow">Target Spec (optional — for comparison)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "targetGar", label: "Target GAR", val: targetGar, set: setTargetGar },
                { id: "targetTs",  label: "Target TS %", val: targetTs,  set: setTargetTs },
                { id: "targetAsh", label: "Target ASH %",val: targetAsh, set: setTargetAsh },
                { id: "targetTm",  label: "Target TM %", val: targetTm,  set: setTargetTm },
              ].map(({ id, label, val, set }) => (
                <div key={id} className="field">
                  <label className="field__label text-xs" htmlFor={id}>{label}</label>
                  <input id={id} type="number" step="0.01" className="input" value={val}
                    onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>

            {/* Save name + actions */}
            <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-border">
              <div className="field flex-1 min-w-40">
                <label className="field__label text-xs" htmlFor="sim-name">Simulation Name (if saving)</label>
                <input id="sim-name" type="text" className="input" placeholder="e.g. Blend Q3 2025 Option A"
                  value={saveName} onChange={(e) => setSaveName(e.target.value)} />
              </div>
              <button type="button" className="button button--ghost button--primary" disabled={isPending}
                onClick={() => simulate(false)} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Simulating…</> : "Simulate"}
              </button>
              <button type="button" className="button button--primary" disabled={isPending}
                onClick={() => simulate(true)} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : "Simulate & Save"}
              </button>
              {simResult && (
                <button type="button" className="button button--ghost button--success"
                  onClick={handleExport}>
                  ↓ Export Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Official result */}
        {simResult && (
          <div className="card border-2 border-primary">
            <div className="card__body gap-3">
              <p className="text-eyebrow text-primary">Official Simulation Result</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {PARAMS.map(({ key, label }) => {
                  const v = simResult.result[key];
                  const cmp = simResult.comparison?.[key as keyof Comparison] ?? null;
                  return (
                    <div key={key}>
                      <p className="text-eyebrow">{label}</p>
                      <p className="text-xl font-semibold">{v != null ? Number(v).toLocaleString() : "—"}</p>
                      {cmp && (
                        <p className={`text-xs mt-0.5 ${deltaColor(cmp.delta, key)}`}>
                          vs target: {cmp.target} ({cmp.delta >= 0 ? "+" : ""}{cmp.delta})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: live preview + history */}
      <div className="flex flex-col gap-5">
        {/* Live Preview */}
        <div className="card border border-primary/30">
          <div className="card__body gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <p className="text-eyebrow">Live Preview</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PARAMS.map(({ key, label }) => {
                const v = live[key];
                return (
                  <div key={key} className="text-center p-2 rounded-lg bg-surface border border-border">
                    <p className="text-eyebrow">{label}</p>
                    <p className="text-lg font-light text-primary">{v != null ? Number(v).toLocaleString() : "—"}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">Updates in real-time as you type</p>
          </div>
        </div>

        <HistoryPanel />
      </div>
    </div>
  );
}

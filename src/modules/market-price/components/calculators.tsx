"use client";

import { useMarketPriceLatest } from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";
import { estimateHPB } from "../utils/hpb-calculator";

const INDEX_OPTIONS = [
  { key: "ici1", label: "ICI 1 (6500)" }, { key: "ici2", label: "ICI 2 (5800)" },
  { key: "ici3", label: "ICI 3 (5000)" }, { key: "ici4", label: "ICI 4 (4200)" },
  { key: "ici5", label: "ICI 5 (3400)" }, { key: "newcastle", label: "Newcastle" },
  { key: "hba",  label: "HBA" },          { key: "hba1", label: "HBA I (5300)" },
  { key: "hba2", label: "HBA II (4100)" },{ key: "hba3", label: "HBA III (3400)" },
];

// ── Standard Index Calculator ─────────────────────────────────────────────────
export function IndexCalculator() {
  const { calcBaseIndex, calcAdjustment, setCalcBaseIndex, setCalcAdjustment } = useMarketPriceUIStore();
  const { data } = useMarketPriceLatest();
  const latest = data?.data?.latest as Record<string, number | null> | null | undefined;

  const basePrice = latest?.[calcBaseIndex] ?? null;
  const finalPrice = basePrice != null ? basePrice + calcAdjustment : null;

  return (
    <div className="card">
      <div className="card__body gap-4">
        <p className="text-eyebrow">Standard Index Calculator</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="field">
            <label className="field__label" htmlFor="calc-base">Base Index</label>
            <select id="calc-base" className="select" value={calcBaseIndex}
              onChange={(e) => setCalcBaseIndex(e.target.value)}>
              {INDEX_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}{latest?.[o.key] != null ? ` — $${Number(latest[o.key]).toFixed(2)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="calc-adj">Premium / Discount (USD)</label>
            <input id="calc-adj" type="number" className="input" step="0.01"
              value={calcAdjustment}
              onChange={(e) => setCalcAdjustment(Number(e.target.value))} />
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-eyebrow mb-1">Final Price</p>
            <p className="text-3xl font-light text-primary">
              {finalPrice != null ? `$${finalPrice.toFixed(2)}` : "—"}
              <span className="text-sm text-muted-foreground ml-1">/MT</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HPB Estimation Calculator ─────────────────────────────────────────────────
export function HPBCalculator() {
  const { hpbGar, hpbTm, hpbTs, hpbAsh, setHpb } = useMarketPriceUIStore();
  const { data } = useMarketPriceLatest();
  const latest = data?.data?.latest as Record<string, number | null> | null | undefined;

  const result = latest ? estimateHPB(hpbGar, hpbTm, hpbTs, hpbAsh, {
    hba:  latest.hba  ?? null, hba1: latest.hba1 ?? null,
    hba2: latest.hba2 ?? null, hba3: latest.hba3 ?? null,
  }) : null;

  const fields = [
    { id: "gar",  label: "GAR (kcal/kg)", key: "hpbGar" as const, val: hpbGar,  step: 10  },
    { id: "tm",   label: "TM (%)",         key: "hpbTm"  as const, val: hpbTm,   step: 0.1 },
    { id: "ts",   label: "TS (%)",          key: "hpbTs"  as const, val: hpbTs,   step: 0.01 },
    { id: "ash",  label: "ASH (%)",         key: "hpbAsh" as const, val: hpbAsh,  step: 0.1 },
  ];

  return (
    <div className="card">
      <div className="card__body gap-4">
        <p className="text-eyebrow">HPB Estimation Calculator</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fields.map((f) => (
            <div key={f.id} className="field">
              <label className="field__label" htmlFor={`hpb-${f.id}`}>{f.label}</label>
              <input id={`hpb-${f.id}`} type="number" className="input" step={f.step}
                value={f.val} onChange={(e) => setHpb(f.key, Number(e.target.value))} />
            </div>
          ))}
        </div>
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-eyebrow">Tier</p>
              <p className="font-medium">{result.tier}</p>
            </div>
            <div>
              <p className="text-eyebrow">Base Price</p>
              <p className="font-medium">${result.basePrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-eyebrow">TM Adj</p>
              <p className={`font-medium ${result.tmAdj < 0 ? "text-red-500" : "text-emerald-500"}`}>
                {result.tmAdj >= 0 ? "+" : ""}{result.tmAdj.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-eyebrow">ASH + TS Adj</p>
              <p className={`font-medium ${(result.ashAdj + result.tsAdj) < 0 ? "text-red-500" : "text-emerald-500"}`}>
                {(result.ashAdj + result.tsAdj) >= 0 ? "+" : ""}{(result.ashAdj + result.tsAdj).toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <p className="text-eyebrow">Est. HPB</p>
              <p className="text-xl font-semibold text-teal-600">${result.finalHpb.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

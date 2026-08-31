"use client";

import { useState } from "react";
import {
  useCalculatorHistory,
  useCalculatorIndexes,
  useMarketPriceLatest,
  useSaveCalculation,
} from "../hooks/use-market-price";
import { useMarketPriceUIStore } from "../store/market-price-ui-store";
import { estimateHPB } from "../utils/hpb-calculator";

const INDEX_OPTIONS = [
  { key: "ici1", label: "ICI 1 (6500)" }, { key: "ici2", label: "ICI 2 (5800)" },
  { key: "ici3", label: "ICI 3 (5000)" }, { key: "ici4", label: "ICI 4 (4200)" },
  { key: "ici5", label: "ICI 5 (3400)" }, { key: "newcastle", label: "Newcastle" },
  { key: "hba", label: "HBA" }, { key: "hba1", label: "HBA I (5300)" },
  { key: "hba2", label: "HBA II (4100)" }, { key: "hba3", label: "HBA III (3400)" },
] as const;

const BASIS_OPTIONS = [
  { key: "fob_barge", label: "FOB Barge", adjustment: 0 },
  { key: "fob_mv_gearless", label: "FOB MV Gearless", adjustment: 1.5 },
  { key: "fob_mv_gng", label: "FOB MV GnG", adjustment: 2 },
  { key: "cif", label: "CIF", adjustment: 8 },
  { key: "fas", label: "FAS", adjustment: -1 },
  { key: "ddp", label: "DDP", adjustment: 12 },
] as const;

const BASE_INDEX_ROWS = [
  { key: "ici3", label: "ICI 3 (5000)", weight: 100 },
] as const;

type BasisKey = typeof BASIS_OPTIONS[number]["key"];

export function IndexCalculator() {
  const state = useMarketPriceUIStore();
  const { data: latestData } = useMarketPriceLatest();
  const latest = latestData?.data?.latest as Record<string, number | null> | null | undefined;
  const asOf = state.calcDatePreset === "custom" ? state.calcCustomDate : state.calcDatePreset === "1w" ? dateDaysAgo(7) : state.calcDatePreset === "2w" ? dateDaysAgo(14) : undefined;
  const { data: indexData, isLoading: indexesLoading } = useCalculatorIndexes(asOf);
  const { data: historyData, isLoading: historyLoading } = useCalculatorHistory();
  const saveCalculation = useSaveCalculation();
  const [prorataMethod, setProrataMethod] = useState<"simple" | "weighted">("weighted");
  const [targetGar, setTargetGar] = useState(5000);
  const [targetProrata, setTargetProrata] = useState("linear");
  const [basis, setBasis] = useState<BasisKey>("fob_barge");

  const indexes = indexData?.data.indexes ?? latest ?? {};
  const dates = indexData?.data.dates ?? {};
  const basePrice = indexes[state.calcBaseIndex] ?? null;
  const qualityAdjustment = (state.calcContractTs - state.calcActualTs) + (state.calcContractAsh - state.calcActualAsh);
  const basisAdjustment = BASIS_OPTIONS.find((item) => item.key === basis)?.adjustment ?? 0;
  const priceAfterBasis = basePrice == null ? null : basePrice + basisAdjustment;
  const priceAfterProrata = priceAfterBasis;
  const finalPrice = priceAfterBasis == null ? null : priceAfterBasis + qualityAdjustment + state.calcAdjustment;

  function save() {
    if (basePrice == null || !indexData?.data.asOf || finalPrice == null) return;
    saveCalculation.mutate({
      baseIndex: state.calcBaseIndex,
      baseIndexDate: indexData.data.asOf.slice(0, 10),
      baseIndexValue: basePrice,
      prorataMethod,
      actualTs: state.calcActualTs,
      contractTs: state.calcContractTs,
      actualAsh: state.calcActualAsh,
      contractAsh: state.calcContractAsh,
      qualityAdjustment,
      premiumDiscount: state.calcAdjustment,
      description: state.calcDescription || null,
      finalPrice,
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
      <main className="card min-w-0">
        <div className="card__body gap-8">
          <div><p className="text-eyebrow">Calculator Index</p><h2 className="text-2xl font-semibold mt-1">Standard Index Calculator</h2><p className="text-sm text-muted-foreground mt-1">Build a transparent index price from market references and commercial adjustments.</p></div>

          <section className="space-y-4"><SectionHeading number="1" title="PRORATA / WEIGHT" /><div className="flex flex-wrap gap-5"><Radio label="Rata-rata Sederhana" name="prorata-method" checked={prorataMethod === "simple"} onChange={() => setProrataMethod("simple")} /><Radio label="Weighted Average" name="prorata-method" checked={prorataMethod === "weighted"} onChange={() => setProrataMethod("weighted")} /></div><div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[42rem] text-sm"><thead className="bg-muted/40"><tr><Th>Index Name</Th><Th>Tanggal</Th><Th>Weight (%)</Th><Th right>Harga (USD/MT)</Th><Th right>Bobot x Harga</Th></tr></thead><tbody>{BASE_INDEX_ROWS.map((row) => { const value = indexes[row.key] ?? null; return <tr key={row.key} className="border-t border-border"><td className="p-3 font-medium">{row.label}</td><td className="p-3 text-muted-foreground">{indexesLoading ? "Loading..." : formatDate(dates[row.key])}</td><td className="p-3"><input type="number" min="0" max="100" className="input w-28" value={row.weight} readOnly={prorataMethod === "simple"} aria-label={`${row.label} weight`} /></td><td className="p-3 text-right">{value == null ? "—" : `$${Number(value).toFixed(2)}`}</td><td className="p-3 text-right">{value == null ? "—" : `$${Number(value * row.weight / 100).toFixed(2)}`}</td></tr>; })}</tbody></table></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ValueTile label="HASIL BASE INDEX" value={basePrice == null ? "—" : `$${basePrice.toFixed(2)} /MT`} /><ValueTile label="Basis GAR Result" value={`${targetGar.toLocaleString()} kcal/kg`} /></div></section>

          <section className="space-y-4"><SectionHeading number="2" title="PRORATA TO TARGET GAR" badge="Opsional" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><ValueTile label="Basis GAR Result" value="5,000 kcal/kg" /><Field label="Target GAR (kcal/kg)"><input type="number" className="input w-full" value={targetGar} onChange={(e) => setTargetGar(Number(e.target.value))} /></Field><Field label="Metode Prorata"><select className="select w-full" value={targetProrata} onChange={(e) => setTargetProrata(e.target.value)}><option value="linear">Linear</option><option value="pro-rata">Pro-rata</option></select></Field><ValueTile label="Harga Setelah Prorata" value={priceAfterProrata == null ? "—" : `$${priceAfterProrata.toFixed(2)} /MT`} /></div></section>

          <section className="space-y-4"><SectionHeading number="3" title="BASIS & FREIGHT ADJUSTMENT" /><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{BASIS_OPTIONS.map((option) => <label key={option.key} className={`rounded-lg border p-3 cursor-pointer transition-colors ${basis === option.key ? "border-primary bg-primary/5" : "border-border"}`}><span className="flex items-start gap-2 text-sm font-medium"><input type="radio" name="shipping-basis" checked={basis === option.key} onChange={() => setBasis(option.key)} />{option.label}</span><span className="block text-xs text-muted-foreground mt-2">Adjustment: {option.adjustment >= 0 ? "+" : ""}{option.adjustment.toFixed(2)} USD/MT</span></label>)}</div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><ValueTile label="Adjustment" value={`${basisAdjustment >= 0 ? "+" : ""}${basisAdjustment.toFixed(2)} USD/MT`} /><ValueTile label="Harga Setelah Basis" value={priceAfterBasis == null ? "—" : `$${priceAfterBasis.toFixed(2)} /MT`} /><Field label="Keterangan Basis"><input className="input w-full" value={BASIS_OPTIONS.find((item) => item.key === basis)?.label ?? ""} readOnly /></Field></div></section>

          <section className="space-y-4"><SectionHeading number="4" title="QUALITY ADJUSTMENT" /><div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[38rem] text-sm"><thead className="bg-muted/40"><tr><Th>Quality</Th><Th>Standard Index (%)</Th><Th>Actual / Contract (%)</Th><Th right>Adjustment (USD/MT)</Th></tr></thead><tbody><QualityRow label="TS (Total Sulfur)" standard={state.calcContractTs} actual={state.calcActualTs} onChange={(value) => state.setCalcQuality("calcActualTs", value)} adjustment={state.calcContractTs - state.calcActualTs} /><QualityRow label="ASH (Air Dry Basis)" standard={state.calcContractAsh} actual={state.calcActualAsh} onChange={(value) => state.setCalcQuality("calcActualAsh", value)} adjustment={state.calcContractAsh - state.calcActualAsh} /></tbody></table></div></section>

          <section className="space-y-4"><SectionHeading number="5" title="ADDITIONAL PREMIUM / DISCOUNT" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Additional (USD/MT)"><input type="number" step="0.01" className="input w-full" value={state.calcAdjustment} onChange={(e) => state.setCalcAdjustment(Number(e.target.value))} /></Field><Field label="Keterangan"><input type="text" className="input w-full" value={state.calcDescription} onChange={(e) => state.setCalcDescription(e.target.value)} placeholder="Type description" /></Field></div></section>

          <section className="space-y-4"><SectionHeading number="6" title="CALCULATION RESULT" /><div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm"><tbody><ResultRow label="Harga Setelah Basis" value={priceAfterBasis == null ? "—" : `$${priceAfterBasis.toFixed(2)}`} /><ResultRow label="TS Adjustment" value={`${(state.calcContractTs - state.calcActualTs).toFixed(2)} USD/MT`} /><ResultRow label="ASH Adjustment" value={`${(state.calcContractAsh - state.calcActualAsh).toFixed(2)} USD/MT`} /><ResultRow label="Additional Premium / Discount" value={`${state.calcAdjustment >= 0 ? "+" : ""}${state.calcAdjustment.toFixed(2)} USD/MT`} /><tr className="border-t-2 border-primary bg-primary/5"><th className="p-4 text-left text-base">FINAL PRICE</th><th className="p-4 text-right text-xl text-primary">{finalPrice == null ? "—" : `$${finalPrice.toFixed(2)} /MT`}</th></tr></tbody></table></div></section>
        </div>
      </main>
      <aside className="xl:sticky xl:top-6 space-y-6"><section className="card"><div className="card__body gap-4"><SectionHeading title="RINGKASAN PARAMETER" /><SummaryRow label="Base Index" value={state.calcBaseIndex.toUpperCase()} /><SummaryRow label="Index Date" value={formatDate(dates[state.calcBaseIndex])} /><SummaryRow label="Prorata" value={prorataMethod === "simple" ? "Rata-rata Sederhana" : "Weighted Average"} /><SummaryRow label="Basis" value={BASIS_OPTIONS.find((item) => item.key === basis)?.label ?? "—"} /><SummaryRow label="Target GAR" value={`${targetGar.toLocaleString()} kcal/kg`} /><SummaryRow label="Description" value={state.calcDescription || "—"} /></div></section><section className="card"><div className="card__body gap-4"><SectionHeading title="HISTORY CALCULATION" /><button type="button" className="button button--primary w-full px-4 py-2" onClick={save} disabled={saveCalculation.isPending || basePrice == null || finalPrice == null} aria-busy={saveCalculation.isPending}>{saveCalculation.isPending ? "Saving..." : "Save Calculation"}</button>{saveCalculation.isSuccess && <p className="text-sm text-emerald-600">Calculation saved.</p>}{saveCalculation.isError && <p className="text-sm text-red-600">Failed to save calculation.</p>}<HistoryList items={historyData?.data ?? []} isLoading={historyLoading} /></div></section></aside>
    </div>
  );
}

function SectionHeading({ number, title, badge }: { number?: string; title: string; badge?: string }) { return <div className="flex items-center gap-2 border-b border-border pb-3"><span className="text-xs font-semibold text-primary">{number ? `${number}.` : ""}</span><h3 className="text-sm font-semibold tracking-wide">{title}</h3>{badge && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{badge}</span>}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field min-w-0"><span className="field__label">{label}</span>{children}</label>; }
function ValueTile({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-muted/20 p-3 min-w-0"><p className="text-eyebrow mb-1">{label}</p><p className="font-medium break-words">{value}</p></div>; }
function Radio({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: () => void }) { return <label className="flex items-center gap-2 text-sm"><input type="radio" name={name} checked={checked} onChange={onChange} />{label}</label>; }
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) { return <th className={`p-3 ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function QualityRow({ label, standard, actual, onChange, adjustment }: { label: string; standard: number; actual: number; onChange: (value: number) => void; adjustment: number }) { return <tr className="border-t border-border"><td className="p-3 font-medium">{label}</td><td className="p-3 text-muted-foreground">{standard.toFixed(2)}%</td><td className="p-3"><input type="number" step="0.01" className="input w-full max-w-40" value={actual} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} actual`} /></td><td className="p-3 text-right">{adjustment >= 0 ? "+" : ""}{adjustment.toFixed(2)}</td></tr>; }
function ResultRow({ label, value }: { label: string; value: string }) { return <tr className="border-t border-border"><td className="p-3">{label}</td><td className="p-3 text-right font-medium">{value}</td></tr>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium break-words">{value}</span></div>; }
function HistoryList({ items, isLoading }: { items: import("../hooks/use-market-price").CalculatorHistoryEntry[]; isLoading: boolean }) { if (isLoading) return <div className="h-20 animate-pulse rounded bg-muted" />; if (!items.length) return <p className="text-sm text-muted-foreground">No calculations saved yet.</p>; return <div className="max-h-80 space-y-3 overflow-y-auto pr-1">{items.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{item.baseIndex}</span><span className="text-muted-foreground">{formatDate(item.baseIndexDate)}</span></div><div className="mt-1 flex justify-between gap-2"><span>Final Price</span><span className="font-semibold text-primary">${item.finalPrice.toFixed(2)}</span></div>{item.description && <p className="mt-1 truncate text-xs text-muted-foreground">{item.description}</p>}</div>)}</div>; }
function dateDaysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString().slice(0, 10); }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "—"; }

export function HPBCalculator() {
  const { hpbGar, hpbTm, hpbTs, hpbAsh, setHpb } = useMarketPriceUIStore();
  const { data } = useMarketPriceLatest();
  const latest = data?.data?.latest as Record<string, number | null> | null | undefined;
  const result = latest ? estimateHPB(hpbGar, hpbTm, hpbTs, hpbAsh, { hba: latest.hba ?? null, hba1: latest.hba1 ?? null, hba2: latest.hba2 ?? null, hba3: latest.hba3 ?? null }) : null;
  const fields = [{ id: "gar", label: "GAR (kcal/kg)", key: "hpbGar" as const, val: hpbGar, step: 10 }, { id: "tm", label: "TM (%)", key: "hpbTm" as const, val: hpbTm, step: 0.1 }, { id: "ts", label: "TS (%)", key: "hpbTs" as const, val: hpbTs, step: 0.01 }, { id: "ash", label: "ASH (%)", key: "hpbAsh" as const, val: hpbAsh, step: 0.1 }];
  return <div className="card"><div className="card__body gap-4"><p className="text-eyebrow">HPB Estimation Calculator</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{fields.map((f) => <div key={f.id} className="field"><label className="field__label" htmlFor={`hpb-${f.id}`}>{f.label}</label><input id={`hpb-${f.id}`} type="number" className="input" step={f.step} value={f.val} onChange={(e) => setHpb(f.key, Number(e.target.value))} /></div>)}</div>{result && <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-border"><ValueTile label="Tier" value={result.tier} /><ValueTile label="Base Price" value={`$${result.basePrice.toFixed(2)}`} /><ValueTile label="TM Adj" value={`${result.tmAdj >= 0 ? "+" : ""}${result.tmAdj.toFixed(2)}`} /><ValueTile label="ASH + TS Adj" value={`${result.ashAdj + result.tsAdj >= 0 ? "+" : ""}${(result.ashAdj + result.tsAdj).toFixed(2)}`} /><ValueTile label="Est. HPB" value={`$${result.finalHpb.toFixed(2)}`} /></div>}</div></div>;
}

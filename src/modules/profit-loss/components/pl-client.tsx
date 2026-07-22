"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api-client";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

interface PLSummary {
  year: number; totalRevenue: number; totalCost: number;
  netProfit: number; marginPct: number; shipmentCount: number;
}

interface ChartBucket { label: string; revenue: number; expense: number; profit: number; }

interface PLShipment {
  id: string; shipmentNumber: string; buyer: string; blDate: string | null;
  qty: number; sellPrice: number; buyPrice: number; freightRate: number;
  totalCostMt: number; actualMarginMt: number; totalMargin: number; revenue: number;
  estMarginMt: number | null; deviation: number | null;
}

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function SummaryCards({ data }: { data: PLSummary | undefined }) {
  if (!data) return null;
  const cards = [
    { label: "Revenue",    value: fmtUSD(data.totalRevenue), color: "text-emerald-500" },
    { label: "Expense",    value: fmtUSD(data.totalCost),    color: "text-red-500"     },
    { label: "Net Profit", value: fmtUSD(data.netProfit),    color: data.netProfit >= 0 ? "text-blue-500" : "text-red-600" },
    { label: "Margin %",   value: `${data.marginPct.toFixed(2)}%`, color: data.marginPct >= 0 ? "text-amber-500" : "text-red-500" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{c.label}</p>
            <p className={`text-3xl font-light ${c.color}`}>{c.value}</p>
            {c.label === "Revenue" && data.shipmentCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{data.shipmentCount} shipments</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function IncomeExpenseChart({ data }: { data: ChartBucket[] }) {
  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Revenue vs Expense</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => fmtUSD(v).replace("$","")} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [fmtUSD(v)]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NetProfitChart({ data }: { data: ChartBucket[] }) {
  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Net Profit Trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => fmtUSD(v).replace("$","")} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [fmtUSD(v), "Net Profit"]} />
            <Area
              type="monotone" dataKey="profit" name="Net Profit"
              stroke="#3b82f6" strokeWidth={2} fill="url(#profitGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ShipmentDetailTable({ year }: { year: number }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["profit-loss", "shipments", year, page],
    queryFn: () => api.get<{ data: PLShipment[]; meta: { total: number; page: number; totalPages: number } }>(`/api/profit-loss/shipments?year=${year}&page=${page}`),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <p className="text-eyebrow">Per Shipment Detail</p>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table--striped text-sm" aria-label="P&L per shipment">
                <thead>
                  <tr>
                    <th>Shipment</th><th>Buyer</th><th>BL Date</th><th>Qty (MT)</th>
                    <th>Sell/MT</th><th>Buy/MT</th><th>Freight</th><th>Total Cost/MT</th>
                    <th>Margin/MT</th><th>Total Margin</th><th>Revenue</th><th>Est. Margin</th><th>Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={13} className="text-center text-muted-foreground py-8">No completed shipments</td></tr>
                  ) : items.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.shipmentNumber}</td>
                      <td className="text-xs">{s.buyer}</td>
                      <td className="text-xs">{s.blDate ? new Date(s.blDate).toLocaleDateString() : "—"}</td>
                      <td>{s.qty.toLocaleString()}</td>
                      <td className="font-mono text-xs">${s.sellPrice.toFixed(2)}</td>
                      <td className="font-mono text-xs">${s.buyPrice.toFixed(2)}</td>
                      <td className="font-mono text-xs">${s.freightRate.toFixed(2)}</td>
                      <td className="font-mono text-xs">${s.totalCostMt.toFixed(2)}</td>
                      <td className={`font-mono text-xs font-semibold ${s.actualMarginMt >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        ${s.actualMarginMt.toFixed(2)}
                      </td>
                      <td className={`font-medium ${s.totalMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmtUSD(s.totalMargin)}
                      </td>
                      <td className="font-medium text-blue-500">{fmtUSD(s.revenue)}</td>
                      <td className="font-mono text-xs text-muted-foreground">
                        {s.estMarginMt != null ? `$${s.estMarginMt.toFixed(2)}` : "—"}
                      </td>
                      <td className={`font-mono text-xs ${s.deviation != null ? (s.deviation >= 0 ? "text-emerald-500" : "text-red-500") : ""}`}>
                        {s.deviation != null ? `${s.deviation >= 0 ? "+" : ""}${s.deviation}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{meta.total} shipments · Page {meta.page} of {meta.totalPages}</p>
                <div className="flex gap-1">
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page<=1} onClick={()=>setPage(p=>p-1)}>←</button>
                  <button type="button" className="button button--sm button--ghost button--neutral"
                    disabled={meta.page>=meta.totalPages} onClick={()=>setPage(p=>p+1)}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function PLClient() {
  const [year,   setYear]   = useState(CURRENT_YEAR);
  const [period, setPeriod] = useState<"monthly"|"quarterly">("monthly");

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["profit-loss", "summary", year, period],
    queryFn: () => api.get<{ data: PLSummary }>(`/api/profit-loss?year=${year}&period=${period}`),
    staleTime: 60 * 1000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["profit-loss", "chart", year, period],
    queryFn: () => api.get<{ data: ChartBucket[] }>(`/api/profit-loss/chart?year=${year}&period=${period}`),
    staleTime: 60 * 1000,
  });

  const chart = chartData?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="select select--sm w-28" value={year}
          onChange={(e) => setYear(Number(e.target.value))} aria-label="Select year">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {(["monthly","quarterly"] as const).map((p) => (
            <button key={p} type="button"
              className={`button button--sm ${period===p?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setPeriod(p)} aria-pressed={period===p}>
              {p==="monthly" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {summaryLoading
        ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">{Array.from({length:4}).map((_,i)=><div key={i} className="card h-24"/>)}</div>
        : <SummaryCards data={summaryData?.data} />
      }

      {/* Charts */}
      {chartLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-pulse">
          <div className="card h-64" /><div className="card h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <IncomeExpenseChart data={chart} />
          <NetProfitChart     data={chart} />
        </div>
      )}

      {/* Per shipment detail */}
      <ShipmentDetailTable year={year} />
    </div>
  );
}

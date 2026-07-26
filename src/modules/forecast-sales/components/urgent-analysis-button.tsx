"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface UrgentAnalysisResult {
  score: number;
  level: string;
  summary: string;
  factors: string[];
  recommendedAction: string;
  documentGaps: string[];
  shipmentBlockers: string[];
  commercialSignals: string[];
  decisionMemo: {
    suggestedDecision: string;
    owner: string;
    nextStep: string;
  };
  relatedShipments: Array<{
    id: string;
    shipmentNumber: string;
    status: string;
    eta?: string;
  }>;
  marketSnapshot: {
    date: string;
    ici3?: number;
    ici4?: number;
    newcastle?: number;
  } | null;
  news: Array<{
    title: string;
    description?: string;
    url?: string;
    source?: string;
  }>;
  analyzedAt: string;
}

function useRunUrgentAnalysis(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; projects: Array<{ id: string; score: number; level: string }> }>(
        `/api/forecasts/${projectId}/urgent-analysis`,
        { projectId }
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecast-detail", projectId] });
      qc.invalidateQueries({ queryKey: ["forecasts"] });
    },
  });
}

export function UrgentAnalysisButton({ projectId }: { projectId: string }) {
  const [showReport, setShowReport] = useState(false);
  const { mutate, isPending, data } = useRunUrgentAnalysis(projectId);

  const handleClick = () => {
    mutate();
    setShowReport(true);
  };

  const report = data?.projects?.[0];

  return (
    <>
      <button
        type="button"
        className="button button--sm button--warning"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <>
          <span className="spinner spinner--sm" aria-hidden="true" /> Analyzing…
        </> : "⚡ Urgent Analysis"}
      </button>

      {showReport && report && (
        <UrgentAnalysisModal
          projectId={projectId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

function UrgentAnalysisModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: forecastData } = useMutation({
    mutationFn: () => api.get<{ data: { urgencyReport: UrgentAnalysisResult } }>(`/api/forecasts/${projectId}`),
  });

  const report = forecastData?.data?.urgencyReport;

  if (!report) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        role="dialog" aria-modal="true">
        <div className="card w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="card__body">
            <p className="text-center text-muted-foreground py-8">Loading report…</p>
          </div>
        </div>
      </div>
    );
  }

  const levelColor = report.level === "CRITICAL" ? "text-red-500" :
    report.level === "HIGH" ? "text-orange-500" :
    report.level === "MEDIUM" ? "text-yellow-500" : "text-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="card__body gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">Urgent Analysis Report</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzed at {new Date(report.analyzedAt).toLocaleString()}
              </p>
            </div>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${levelColor}`}>{report.score}</div>
              <div>
                <p className={`text-lg font-semibold ${levelColor}`}>{report.level}</p>
                <p className="text-xs text-muted-foreground">Urgency Level</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded p-3">
              <p className="text-sm">{report.summary}</p>
            </div>

            {report.factors.length > 0 && (
              <div>
                <p className="text-eyebrow mb-2">Urgency Factors</p>
                <ul className="space-y-1">
                  {report.factors.map((f, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.documentGaps.length > 0 && (
              <div>
                <p className="text-eyebrow mb-2">Document Gaps</p>
                <ul className="space-y-1">
                  {report.documentGaps.map((d, i) => (
                    <li key={i} className="text-sm text-red-500">⚠ {d}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.shipmentBlockers.length > 0 && (
              <div>
                <p className="text-eyebrow mb-2">Shipment Blockers</p>
                <ul className="space-y-1">
                  {report.shipmentBlockers.map((s, i) => (
                    <li key={i} className="text-sm text-orange-500">⚠ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.commercialSignals.length > 0 && (
              <div>
                <p className="text-eyebrow mb-2">Commercial Signals</p>
                <ul className="space-y-1">
                  {report.commercialSignals.map((c, i) => (
                    <li key={i} className="text-sm text-blue-500">→ {c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-primary/10 rounded p-3">
              <p className="text-eyebrow mb-2">Decision Memo</p>
              <p className="text-sm font-semibold mb-1">{report.decisionMemo.suggestedDecision}</p>
              <p className="text-xs text-muted-foreground mb-2">Owner: {report.decisionMemo.owner}</p>
              <p className="text-sm">{report.decisionMemo.nextStep}</p>
            </div>

            <div>
              <p className="text-eyebrow mb-2">Recommended Action</p>
              <p className="text-sm bg-amber-500/10 rounded p-3">{report.recommendedAction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

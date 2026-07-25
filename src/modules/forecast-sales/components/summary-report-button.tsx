"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

interface SummaryReportButtonProps {
  forecastId: string;
}

/**
 * Button that triggers server-side Summary Report PDF generation,
 * waits for the response, then opens/downloads the resulting PDF.
 */
export function SummaryReportButton({ forecastId }: SummaryReportButtonProps) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [pdfUrl,   setPdfUrl]   = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forecasts/${forecastId}/summary-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Summary Report generation failed");
      }
      const { data } = await res.json() as { data: { pdfUrl: string; title: string } };
      setPdfUrl(data.pdfUrl);

      // Auto-open in new tab
      window.open(data.pdfUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="button button--sm button--ghost button--neutral"
        onClick={handleGenerate}
        disabled={loading}
        aria-label="Generate Summary Report PDF"
      >
        {loading ? (
          <><span className="spinner spinner--xs" aria-hidden="true" /> Generating…</>
        ) : (
          <><FileText size={14} aria-hidden="true" /> Summary Report</>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {pdfUrl && !loading && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline"
        >
          Open last generated report
        </a>
      )}
    </div>
  );
}

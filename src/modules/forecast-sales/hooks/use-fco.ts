import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ForecastDetail } from "./use-forecasts";

export type FCOAction = "generate" | "resend" | "revise";

const COMPANY_DEFAULTS = {
  companyName:    "CoalTrade Indonesia",
  companyAddress: "Jakarta, Indonesia",
  companyPhone:   "+62-21-XXXXXXXX",
  companyEmail:   "trade@coaltrade.id",
};

interface UseFCOReturn {
  generate: (projectId: string, project: ForecastDetail, action?: FCOAction) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

export function useFCO(): UseFCOReturn {
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(
    projectId: string,
    project: ForecastDetail,
    action: FCOAction = "generate",
  ): Promise<void> {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Record generation server-side, get FCO number + version
      const res = await api.post<{
        data: { fcoNumber: string; version: number; generatedBy: string };
      }>(`/api/forecasts/${projectId}/generate-fco`, { action });

      const { fcoNumber, version, generatedBy } = res.data;

      // 2. Generate PDF client-side with jsPDF
      const { generateFCO } = await import("../utils/fco-generator");
      const blob = await generateFCO({
        project,
        ...COMPANY_DEFAULTS,
        generatedBy,
        fcoNumber,
        version,
      });

      // 3. Trigger browser download
      const url      = URL.createObjectURL(blob);
      const anchor   = document.createElement("a");
      anchor.href    = url;
      anchor.download = `${fcoNumber}_v${version}_${project.buyer.replace(/\s+/g, "_")}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);

      // 4. Invalidate forecast cache so FCO badge updates
      qc.invalidateQueries({ queryKey: ["forecasts"] });
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to generate FCO");
    } finally {
      setIsGenerating(false);
    }
  }

  return { generate, isGenerating, error };
}

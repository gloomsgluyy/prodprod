import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ForecastDetail } from "./use-forecasts";
import type { FcoTemplateProfile } from "@/lib/fco-template";

export type FCOAction = "generate" | "resend" | "revise";

interface UseFCOReturn {
   generate: (projectId: string, project: ForecastDetail, action?: FCOAction, templateProfile?: FcoTemplateProfile) => Promise<void>;
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
    templateProfile?: FcoTemplateProfile,
  ): Promise<void> {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Record generation server-side, get FCO number + version
      const res = await api.post<{
      data: { fcoNumber: string; version: number; generatedBy: string; docxUrl?: string | null };
      }>(`/api/forecasts/${projectId}/generate-fco`, { action, templateProfile });

      const { fcoNumber, version, docxUrl } = res.data;

      if (!docxUrl) throw new Error("FCO DOCX output was not generated");
      const response = await fetch(docxUrl);
      if (!response.ok) throw new Error("FCO DOCX download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fcoNumber}_v${version}_${project.buyer.replace(/\s+/g, "_")}.docx`;
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

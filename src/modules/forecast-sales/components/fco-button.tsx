"use client";

import { useFCO, type FCOAction } from "../hooks/use-fco";
import type { ForecastDetail } from "../hooks/use-forecasts";
import { useState } from "react";
import type { FcoTemplateProfile } from "@/lib/fco-template";

interface FCOButtonProps {
  projectId: string;
  project:   ForecastDetail;
  action?:   FCOAction;
  label?:    string;
  size?:     "sm" | "md";
}

const ACTION_LABELS: Record<FCOAction, string> = {
  generate: "Generate FCO",
  resend:   "Re-send FCO",
  revise:   "Revise FCO",
};

export function FCOButton({
  projectId,
  project,
  action = "generate",
  label,
  size = "sm",
}: FCOButtonProps) {
  const { generate, isGenerating, error } = useFCO();
  const [template, setTemplate] = useState<FcoTemplateProfile>(project.entity?.toLowerCase().includes("camaraderie") ? "camaraderie" : "mse");

  const ALLOWED = ["approved","waiting_approval","deal","submitted","revision"];
  if (!ALLOWED.includes(project.status)) return null;

  const btnLabel = label ?? ACTION_LABELS[action];

  return (
    <div className="inline-flex flex-col gap-1">
      <label className="text-xs text-muted-foreground" htmlFor={`fco-template-${projectId}`}>Letterhead template</label>
      <select id={`fco-template-${projectId}`} className="select select--sm" value={template} onChange={(event) => setTemplate(event.target.value as FcoTemplateProfile)} disabled={isGenerating}>
        <option value="mse">PT Mahakarya Sentra Energi</option>
        <option value="camaraderie">Camaraderie Pte Ltd</option>
      </select>
      <button
        type="button"
        className={`button ${size === "sm" ? "button--sm" : ""} button--primary`}
        disabled={isGenerating}
        aria-busy={isGenerating}
        onClick={() => generate(projectId, project, action, template)}
      >
        {isGenerating ? (
          <>
            <span className="spinner spinner--sm" aria-hidden="true" />
            Generating…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" opacity=".4" />
              <path d="M14 2v6h6M8 13h8v1.5H8zm0 3h6v1.5H8z" />
            </svg>
            {btnLabel}
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}

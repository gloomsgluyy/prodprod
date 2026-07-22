// Quality comparison engine per SRS FR-QC-004
// Compares measured spec against contract spec — returns status + delta

export interface CoalSpec {
  gar?: number | null; nar?: number | null; tm?: number | null; im?: number | null;
  ts?: number | null; ash?: number | null; vm?: number | null; hgi?: number | null; adb?: number | null;
}

export interface SpecDelta {
  param: string; label: string;
  contract: number | null; measured: number | null; delta: number | null;
  status: "pass" | "warning" | "critical";
}

// Higher is better for GAR/NAR/HGI; lower is better for TM/TS/ASH
const DIRECTION: Record<string, "higher" | "lower"> = {
  gar: "higher", nar: "higher", hgi: "higher",
  tm: "lower", ts: "lower", ash: "lower", im: "lower",
};
// Warning tolerance thresholds (absolute)
const WARN_THRESHOLD: Record<string, number> = {
  gar: 200, nar: 200, tm: 2, ts: 0.1, ash: 1, im: 1, hgi: 3, adb: 200,
};

export function compareSpecs(measured: CoalSpec, contract: CoalSpec): SpecDelta[] {
  const LABELS: Record<string, string> = {
    gar: "GAR", nar: "NAR", tm: "TM", im: "IM",
    ts: "TS", ash: "ASH", vm: "VM", hgi: "HGI", adb: "ADB",
  };

  return Object.keys(LABELS).map((key) => {
    const m = (measured as Record<string, number | null | undefined>)[key] ?? null;
    const c = (contract as Record<string, number | null | undefined>)[key] ?? null;
    const delta = m != null && c != null ? Math.round((m - c) * 100) / 100 : null;
    const dir   = DIRECTION[key] ?? "lower";
    const threshold = WARN_THRESHOLD[key] ?? 0;

    let status: "pass" | "warning" | "critical" = "pass";
    if (delta != null) {
      const diff = Math.abs(delta);
      if (dir === "higher" && delta < 0) {
        status = diff > threshold * 2 ? "critical" : diff > threshold ? "warning" : "pass";
      } else if (dir === "lower" && delta > 0) {
        status = diff > threshold * 2 ? "critical" : diff > threshold ? "warning" : "pass";
      }
    }

    return { param: key, label: LABELS[key], contract: c, measured: m, delta, status };
  });
}

export function deriveQualityStatus(
  contractSpec: CoalSpec | null,
  measuredSpecs: (CoalSpec | null)[],
): "pending" | "passed" | "warning" | "need_review" | "claim_potential" | "rejected" {
  if (!contractSpec) return "pending";

  const allDeltas = measuredSpecs
    .filter(Boolean)
    .flatMap((spec) => compareSpecs(spec!, contractSpec));

  if (allDeltas.length === 0) return "pending";

  const hasCritical = allDeltas.some((d) => d.status === "critical");
  const hasWarning  = allDeltas.some((d) => d.status === "warning");

  if (hasCritical) return "claim_potential";
  if (hasWarning)  return "warning";
  return "passed";
}

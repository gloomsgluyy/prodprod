// HPB Estimation per SRS FR-MKT-003
// Tiers: HBA (6322), HBA I (5300), HBA II (4100), HBA III (3400)

interface HBATier { gar: number; label: string; hbaKey: keyof HBAValues }
interface HBAValues { hba: number|null; hba1: number|null; hba2: number|null; hba3: number|null }

const TIERS: HBATier[] = [
  { gar: 6322, label: "HBA",       hbaKey: "hba"  },
  { gar: 5300, label: "HBA I",     hbaKey: "hba1" },
  { gar: 4100, label: "HBA II",    hbaKey: "hba2" },
  { gar: 3400, label: "HBA III",   hbaKey: "hba3" },
];

export interface HPBResult {
  tier: string;
  basePrice: number;
  tmAdj: number;
  ashAdj: number;
  tsAdj: number;
  finalHpb: number;
}

export function estimateHPB(
  gar: number, tm: number, ts: number, ash: number,
  hbaValues: HBAValues,
): HPBResult | null {
  // Find closest tier by GAR
  const tier = TIERS.reduce((prev, curr) =>
    Math.abs(curr.gar - gar) < Math.abs(prev.gar - gar) ? curr : prev,
  );

  const tierHba = hbaValues[tier.hbaKey];
  if (tierHba == null) return null;

  const basePrice = (gar / tier.gar) * tierHba;

  // Reference defaults per tier
  const refTm  = tier.gar >= 6000 ? 23 : tier.gar >= 5000 ? 28 : tier.gar >= 4000 ? 33 : 38;
  const refAsh  = tier.gar >= 6000 ? 5  : tier.gar >= 5000 ? 7  : tier.gar >= 4000 ? 9  : 11;
  const refTs   = 0.5;

  const tmAdj  = (tm  - refTm)  * -0.01 * basePrice;
  const ashAdj = (ash - refAsh) * -0.005 * basePrice;
  const tsAdj  = ((ts - refTs) * 10) * -0.01 * basePrice;

  return {
    tier: tier.label,
    basePrice: Math.round(basePrice * 100) / 100,
    tmAdj:     Math.round(tmAdj  * 100) / 100,
    ashAdj:    Math.round(ashAdj * 100) / 100,
    tsAdj:     Math.round(tsAdj  * 100) / 100,
    finalHpb:  Math.max(0, Math.round((basePrice + tmAdj + ashAdj + tsAdj) * 100) / 100),
  };
}

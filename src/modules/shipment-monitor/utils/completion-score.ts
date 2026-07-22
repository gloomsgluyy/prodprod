// Completeness score per SRS FR-SHIP-016
// Placeholder values don't count: null, undefined, "", "0", "N/A", "-"

type ScoreableShipment = {
  shipmentNumber?: string | null; projectId?: string | null; buyer?: string | null;
  type?: string | null; pic?: string | null;
  salesPrice?: unknown; buyingPrice?: unknown; qtyPlan?: unknown;
  paymentTerm?: string | null; shippingTerm?: string | null;
  supplier?: string | null; source?: string | null; iupOp?: string | null; region?: string | null;
  pol?: string | null; pod?: string | null; laycanStart?: unknown; laycanEnd?: unknown;
  vesselName?: string | null; bargeName?: string | null;
  specGar?: unknown; specTs?: unknown; specAsh?: unknown; specTm?: unknown;
  blDate?: unknown; qtyLoaded?: unknown; qtyFinal?: unknown;
};

function valid(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  return s !== "" && s !== "0" && s !== "N/A" && s !== "-";
}

export function computeCompletionScore(s: ScoreableShipment): number {
  const checks = [
    // Header Identity (5)
    valid(s.shipmentNumber), valid(s.buyer), valid(s.type), valid(s.pic), valid(s.projectId),
    // Commercial (5)
    valid(s.salesPrice), valid(s.buyingPrice), valid(s.qtyPlan), valid(s.paymentTerm), valid(s.shippingTerm),
    // Source (4)
    valid(s.supplier), valid(s.source), valid(s.iupOp), valid(s.region),
    // Route & Schedule (6)
    valid(s.pol), valid(s.pod), valid(s.laycanStart), valid(s.laycanEnd), valid(s.vesselName), valid(s.bargeName),
    // Quality spec (4)
    valid(s.specGar), valid(s.specTs), valid(s.specAsh), valid(s.specTm),
    // Documents/closing (4)
    valid(s.blDate), valid(s.qtyLoaded), valid(s.qtyFinal), true, // last always passes — represents "assigned"
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

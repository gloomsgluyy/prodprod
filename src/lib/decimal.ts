/**
 * Prisma returns Decimal fields as objects that don't have JS number methods.
 * Use these helpers before returning data from API routes.
 */

/** Convert any Prisma Decimal / null / undefined to a plain JS number or null */
export function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/**
 * Recursively convert all Decimal-like values in an object to plain numbers.
 * Pass the list of field names that need conversion.
 */
export function serialiseDecimals<T extends Record<string, unknown>>(
  obj: T,
  fields: readonly string[],
): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const f of fields) {
    if (f in out) out[f] = toNum(out[f]);
  }
  return out as T;
}

/** Apply serialiseDecimals to an array */
export function serialiseDecimalsMany<T extends Record<string, unknown>>(
  arr: T[],
  fields: readonly string[],
): T[] {
  return arr.map((item) => serialiseDecimals(item, fields));
}

/** Common field lists */
export const SHIPMENT_DECIMAL_FIELDS = [
  "qtyPlan","qtyLoaded","qtyFinal","salesPrice","buyingPrice","freightRate",
  "royaltyCost","taxExportCost","surveyCost","financeCost","marginMt","completionScore",
  "specGar","specTs","specAsh","specTm",
] as const;

export const MARKET_PRICE_DECIMAL_FIELDS = [
  "ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3",
] as const;

export const SOURCE_DECIMAL_FIELDS = [
  "specGar","specTs","specAsh","specTm","specIm","specFc","specAdb","specNar",
  "stockAvailable","minStockAlert","fobBargePriceUsd","fobBargePriceIdr",
  "rkabVolume","rkabUsed","kuotaExportTotal","kuotaExportUsed",
  "cobMt","haulingDistanceKm","haulingCostIdrPerMt",
] as const;

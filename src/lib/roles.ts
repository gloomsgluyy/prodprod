// Roles that can see revenue/margin/P&L
export const EXECUTIVE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO"] as const;

export type ExecutiveRole = (typeof EXECUTIVE_ROLES)[number];

export function isExecutive(role: string): boolean {
  return EXECUTIVE_ROLES.includes(role as ExecutiveRole);
}

// Roles that can edit market prices (ADMIN_MARKETING primary; exec fallback per SRS)
export const MARKET_PRICE_EDIT_ROLES = [
  "ADMIN_MARKETING", "CEO", "DIRUT", "ASS_DIRUT",
] as const;

export function canEditMarketPrice(role: string): boolean {
  return MARKET_PRICE_EDIT_ROLES.includes(role as (typeof MARKET_PRICE_EDIT_ROLES)[number]);
}

const DOCUMENT_MUTATE_ROLES = [
  "CEO", "DIRUT", "ASS_DIRUT", "COO",
  "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4",
  "ADMIN_OPERATION", "ADMIN_MARKETING",
] as const;

export function canMutateShipmentDocuments(role: string): boolean {
  return DOCUMENT_MUTATE_ROLES.includes(role as (typeof DOCUMENT_MUTATE_ROLES)[number]);
}

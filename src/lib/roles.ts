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

const SHIPMENT_WRITE_ROLES = [
  "CEO", "DIRUT", "ASS_DIRUT", "COO", "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4", "ADMIN_OPERATION",
] as const;

export function canMutateShipment(role: string): boolean {
  return SHIPMENT_WRITE_ROLES.includes(role as (typeof SHIPMENT_WRITE_ROLES)[number]);
}

export const FINANCE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "FINANCE"] as const;
export const COMMERCIAL_WRITE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4"] as const;
export const TASK_WRITE_ROLES = [...COMMERCIAL_WRITE_ROLES, "TRAFFIC_HEAD", "ADMIN_OPERATION"] as const;

export function isFinance(role: string): boolean {
  return FINANCE_ROLES.includes(role as (typeof FINANCE_ROLES)[number]);
}

export function canMutateCommercial(role: string): boolean {
  return COMMERCIAL_WRITE_ROLES.includes(role as (typeof COMMERCIAL_WRITE_ROLES)[number]);
}

export function canMutateTask(role: string): boolean {
  return TASK_WRITE_ROLES.includes(role as (typeof TASK_WRITE_ROLES)[number]);
}

export const OPERATIONS_WRITE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4", "ADMIN_OPERATION", "SPV_SOURCING", "SOURCING_1", "SOURCING_2", "SOURCING_3", "SOURCING_4"] as const;
export const PARTNER_WRITE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "ADMIN_MARKETING", "ADMIN_OPERATION"] as const;

export function canMutateOperations(role: string): boolean {
  return OPERATIONS_WRITE_ROLES.includes(role as (typeof OPERATIONS_WRITE_ROLES)[number]);
}

export function canMutatePartner(role: string): boolean {
  return PARTNER_WRITE_ROLES.includes(role as (typeof PARTNER_WRITE_ROLES)[number]);
}

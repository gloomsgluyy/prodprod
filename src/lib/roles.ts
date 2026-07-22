// Roles that can see revenue/margin/P&L
export const EXECUTIVE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO"] as const;

export type ExecutiveRole = (typeof EXECUTIVE_ROLES)[number];

export function isExecutive(role: string): boolean {
  return EXECUTIVE_ROLES.includes(role as ExecutiveRole);
}

// Roles that can edit market prices
export const MARKET_PRICE_EDIT_ROLES = ["ADMIN_MARKETING"] as const;

export function canEditMarketPrice(role: string): boolean {
  return MARKET_PRICE_EDIT_ROLES.includes(role as (typeof MARKET_PRICE_EDIT_ROLES)[number]);
}

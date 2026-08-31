import { prisma } from "@/lib/prisma";

export const MARKET_PRICE_FIELDS = [
  "ici1", "ici2", "ici3", "ici4", "ici5", "newcastle",
  "hba", "hba1", "hba2", "hba3", "mgoUsd", "usdIdr",
] as const;

export type MarketPriceField = typeof MARKET_PRICE_FIELDS[number];

type LastKnownField = {
  value: unknown;
  date: Date;
  createdAt: Date;
};

export async function getLastKnownMarketPrices<const T extends readonly MarketPriceField[]>(
  fields: T,
  asOf?: Date,
) {
  const rows = await Promise.all(fields.map(async (field) => {
    const latest = await prisma.marketPrice.findFirst({
      where: { [field]: { not: null }, ...(asOf ? { date: { lte: asOf } } : {}) },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { [field]: true, date: true, createdAt: true } as never,
    });
    const previous = latest
      ? await prisma.marketPrice.findFirst({
          where: {
            [field]: { not: null },
            date: { lt: (latest as { date: Date }).date },
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: { [field]: true, date: true, createdAt: true } as never,
        })
      : null;

    return [
      field,
      [latest, previous].filter(Boolean).map((row) => ({
        value: (row as Record<string, unknown>)[field],
        date: (row as { date: Date }).date,
        createdAt: (row as { createdAt: Date }).createdAt,
      })),
    ] as const;
  }));

  const latest = {} as Record<MarketPriceField, LastKnownField | null>;
  const previous = {} as Record<MarketPriceField, LastKnownField | null>;

  for (const [field, values] of rows) {
    latest[field] = values[0] ?? null;
    previous[field] = values[1] ?? null;
  }

  return { latest, previous };
}

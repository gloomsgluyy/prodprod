export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

const PRICE_FIELDS = ["ici1", "ici2", "ici3", "ici4", "ici5", "newcastle", "hba", "hba1", "hba2", "hba3"] as const;

function serialise(row: Record<string, unknown>) {
  const out = { ...row };
  for (const field of PRICE_FIELDS) if (out[field] != null) out[field] = Number(out[field]);
  return out;
}

function range(end: Date, days: number) {
  const until = new Date(end);
  until.setDate(until.getDate() - 1);
  const from = new Date(until);
  from.setDate(from.getDate() - days + 1);
  return { from, until };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached("dashboard:market-mini", async () => {
    const [entries, absoluteLatest, known] = await Promise.all([
      prisma.marketPrice.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
        select: { date: true, createdAt: true, ici1: true, ici2: true, ici3: true, ici4: true, ici5: true, newcastle: true, hba: true, hba1: true, hba2: true, hba3: true },
      }),
      prisma.marketPrice.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, date: true, createdAt: true } }),
      getLastKnownMarketPrices(PRICE_FIELDS),
    ]);
    if (!entries[0] && !absoluteLatest && !Object.values(known.latest).some(Boolean)) return { latest: null, averages: null };

    const latest = { ...(absoluteLatest ?? {}), ...(entries[0] ?? {}) } as Record<string, unknown>;
    for (const field of PRICE_FIELDS) latest[field] = known.latest[field]?.value ?? null;
    const latestDate = (latest.date as Date) ?? new Date();
    const average = (days: number) => {
      const window = range(latestDate, days);
      const matching = entries.filter((entry) => entry.date >= window.from && entry.date <= window.until);
      const values = Object.fromEntries(PRICE_FIELDS.map((field) => {
        const prices = matching.map((entry) => entry[field]).filter((value): value is NonNullable<typeof value> => value != null).map(Number);
        return [field, prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null];
      }));
      return { ...window, values };
    };
    return { latest: serialise(latest), averages: { twoWeeks: average(14), fourWeeks: average(28), month: average(30) } };
  }, TTL.MARKET_PRICE);

  return NextResponse.json({ data });
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";

const PRICE_FIELDS = ["ici1", "ici2", "ici3", "ici4", "ici5", "newcastle", "hba", "hba1", "hba2", "hba3"] as const;

function serialise(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
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
    const entries = await prisma.marketPrice.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { date: true, createdAt: true, ici1: true, ici2: true, ici3: true, ici4: true, ici5: true, newcastle: true, hba: true, hba1: true, hba2: true, hba3: true },
    });
    if (!entries[0]) return { latest: null, averages: null };

    const latest = entries[0];
    const average = (days: number) => {
      const window = range(latest.date, days);
      const matching = entries.filter((entry) => entry.date >= window.from && entry.date <= window.until);
      const values = Object.fromEntries(PRICE_FIELDS.map((field) => {
        const prices = matching.map((entry) => entry[field]).filter((value): value is NonNullable<typeof value> => value != null).map(Number);
        return [field, prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null];
      }));
      return { ...window, values };
    };

    return {
      latest: serialise(latest as unknown as Record<string, unknown>),
      averages: { twoWeeks: average(14), fourWeeks: average(28), month: average(30) },
    };
  }, TTL.MARKET_PRICE);

  return NextResponse.json({ data });
}

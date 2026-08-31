import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

const FIELDS = [
  "ici1", "ici2", "ici3", "ici4", "ici5", "newcastle",
  "hba", "hba1", "hba2", "hba3",
] as const;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const value = new URL(request.url).searchParams.get("asOf");
  const asOf = value ? new Date(`${value}T23:59:59.999Z`) : undefined;
  if (asOf && Number.isNaN(asOf.getTime())) {
    return NextResponse.json({ error: "Invalid asOf date" }, { status: 422 });
  }

  const known = await getLastKnownMarketPrices(FIELDS, asOf);
  const available = Object.values(known.latest).filter((entry): entry is NonNullable<typeof entry> => entry != null);
  const snapshotDate = available.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.date ?? null;
  const indexes = Object.fromEntries(FIELDS.map((field) => [field, known.latest[field]?.value ?? null]));
  const dates = Object.fromEntries(FIELDS.map((field) => [field, known.latest[field]?.date.toISOString() ?? null]));

  return NextResponse.json({
    data: {
      indexes: Object.fromEntries(Object.entries(indexes).map(([field, price]) => [field, price == null ? null : Number(price)])),
      dates,
      asOf: snapshotDate?.toISOString() ?? null,
    },
  });
}

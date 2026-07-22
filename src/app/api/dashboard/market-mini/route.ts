export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";

const PRICE_FIELDS = ["ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3"] as const;

function serialise(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out: Record<string, unknown> = { ...row };
  for (const f of PRICE_FIELDS) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached(
    "dashboard:market-mini",
    async () => {
      const latest = await prisma.marketPrice.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, date: true, ici1: true, ici2: true, ici3: true, ici4: true, ici5: true, newcastle: true, hba: true, hba1: true, hba2: true, hba3: true, createdAt: true },
      });
      if (!latest) return { latest: null, prev: null };

      const prev = await prisma.marketPrice.findFirst({
        where: { id: { not: latest.id } },
        orderBy: { createdAt: "desc" },
        select: { ici1: true, ici2: true, ici3: true, ici4: true, ici5: true, newcastle: true, hba: true, hba1: true, hba2: true, hba3: true },
      });

      return {
        latest: serialise(latest as unknown as Record<string, unknown>),
        prev:   serialise(prev   as unknown as Record<string, unknown>),
      };
    },
    TTL.MARKET_PRICE,
  );

  return NextResponse.json({ data });
}


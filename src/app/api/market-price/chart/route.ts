export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "4w"; // 2w | 4w | all

  const cutoff = range === "all" ? undefined
    : new Date(Date.now() - (range === "2w" ? 14 : 28) * 86400000);

  const entries = await prisma.marketPrice.findMany({
    where: cutoff ? { createdAt: { gte: cutoff } } : undefined,
    orderBy: { createdAt: "asc" },
      select: {
        date: true, ici1: true, ici2: true, ici3: true, ici4: true, ici5: true,
        newcastle: true, hba: true, hba1: true, hba2: true, hba3: true,
        mgoUsd: true, usdIdr: true, createdAt: true,
      },
  });

  // Serialise Decimal → number
  const data = entries.map((e) => ({
    date: e.date.toISOString().split("T")[0],
    ici1:      e.ici1      != null ? Number(e.ici1)      : null,
    ici2:      e.ici2      != null ? Number(e.ici2)      : null,
    ici3:      e.ici3      != null ? Number(e.ici3)      : null,
    ici4:      e.ici4      != null ? Number(e.ici4)      : null,
    ici5:      e.ici5      != null ? Number(e.ici5)      : null,
    newcastle: e.newcastle != null ? Number(e.newcastle) : null,
    hba:       e.hba       != null ? Number(e.hba)       : null,
    hba1:      e.hba1      != null ? Number(e.hba1)      : null,
    hba2:      e.hba2      != null ? Number(e.hba2)      : null,
    hba3:      e.hba3      != null ? Number(e.hba3)      : null,
    mgoUsd:    e.mgoUsd    != null ? Number(e.mgoUsd)    : null,
    usdIdr:    e.usdIdr    != null ? Number(e.usdIdr)    : null,
  }));

  return NextResponse.json({ data });
}


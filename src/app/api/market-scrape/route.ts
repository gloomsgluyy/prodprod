import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canEditMarketPrice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidate } from "@/lib/cache";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditMarketPrice(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // TODO: call Groq AI to scrape market prices from configured sources
  // For now returns a stub result so the UI can demonstrate the flow
  const stubPrices = {
    ici1: 68.50, ici2: 59.20, ici3: 52.10, ici4: 43.80, ici5: 35.60,
    newcastle: 112.30, hba: 95.40, hba1: 82.10, hba2: 64.50, hba3: 48.20,
  };

  const entry = await prisma.marketPrice.create({
    data: {
      ...stubPrices,
      date: new Date(),
      source: "AI Scrape (stub)",
      action: "scrape",
      updatedBy: session.user.id,
    },
  });

  await Promise.all([
    invalidate("dashboard:market-mini"),
    invalidate("market-price:latest"),
    writeAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: "scraped",
      entity: "market_price",
      entityId: entry.id,
      details: { source: "AI Scrape (stub)" },
    }),
  ]);

  return NextResponse.json({ data: entry, message: "Scrape complete (stub)" });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canEditMarketPrice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidate } from "@/lib/cache";
import { writeAuditLog } from "@/lib/audit";
import { chatText, hasAI, parseJson } from "@/lib/ai";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditMarketPrice(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!hasAI()) {
    return NextResponse.json({
      error: "Auto scrape provider is not configured. No market data was written.",
      code: "MARKET_SCRAPE_PROVIDER_UNAVAILABLE",
    }, { status: 503 });
  }

  let prices: Record<string, number | null>;
  try {
      prices = parseJson(await chatText([
          { role: "system", content: "Return only JSON numbers for coal market benchmark estimate today. Keys: ici1,ici2,ici3,ici4,ici5,newcastle,hba,hba1,hba2,hba3,mgoUsd,usdIdr. No markdown." },
          { role: "user", content: "Estimate latest Indonesia coal benchmarks and FX from public market context. Use null if unknown." },
        ], { json: true }), {});
      if (!Object.values(prices).some((value) => typeof value === "number" && Number.isFinite(value))) {
        return NextResponse.json({ error: "Scrape provider returned no usable market values.", code: "MARKET_SCRAPE_EMPTY" }, { status: 502 });
      }
    } catch {
      return NextResponse.json({ error: "Market scrape provider failed. No market data was written.", code: "MARKET_SCRAPE_FAILED" }, { status: 502 });
  }

  const entry = await prisma.marketPrice.create({
    data: {
      ...prices,
      date: new Date(),
      source: "AI market scrape",
      action: "scrape",
      updatedBy: session.user.id,
      notes: "AI-estimated market scrape; verify against paid indices before trading.",
    },
    include: { user: { select: { name: true } } },
  });

  await Promise.all([
    invalidate("dashboard:market-mini"),
    invalidate("market-price:latest"),
    invalidate("market-price:fx-rate"),
    writeAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: "scraped",
      entity: "market_price",
      entityId: entry.id,
      details: { source: "AI market scrape" },
    }),
  ]);

  return NextResponse.json({ data: entry, message: "Auto scrape saved. Verify against paid indices before trading." });
}

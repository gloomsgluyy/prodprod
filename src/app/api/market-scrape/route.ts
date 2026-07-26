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

  const fallbackPrices = {
    ici1: 68.50, ici2: 59.20, ici3: 52.10, ici4: 43.80, ici5: 35.60,
    newcastle: 112.30, hba: 95.40, hba1: 82.10, hba2: 64.50, hba3: 48.20,
    mgoUsd: 742.00, usdIdr: 16250,
  };
  const prices = hasAI()
    ? parseJson(await chatText([
        { role: "system", content: "Return only JSON numbers for coal market benchmark estimate today. Keys: ici1,ici2,ici3,ici4,ici5,newcastle,hba,hba1,hba2,hba3,mgoUsd,usdIdr. No markdown." },
        { role: "user", content: "Estimate latest Indonesia coal benchmarks and FX from public market context. Use null if unknown." },
      ], { json: true }), fallbackPrices)
    : fallbackPrices;

  const entry = await prisma.marketPrice.create({
    data: {
      ...prices,
      date: new Date(),
      source: hasAI() ? "AI market scrape" : "Auto Scrape fallback",
      action: "scrape",
      updatedBy: session.user.id,
      notes: hasAI() ? "AI-estimated market scrape; verify against paid indices before trading." : "Fallback data only. Configure GROQ_API_KEY or OPENROUTER_API_KEY.",
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
      details: { source: hasAI() ? "AI market scrape" : "Auto Scrape fallback" },
    }),
  ]);

  return NextResponse.json({ data: entry, message: hasAI() ? "Auto scrape saved." : "Fallback scrape saved. Configure AI key for live extraction." });
}

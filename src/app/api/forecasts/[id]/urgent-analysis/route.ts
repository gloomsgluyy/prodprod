export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchExternalNews } from "@/lib/external-news";

const EXECUTIVE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

function daysUntil(value?: Date | null): number | null {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function scoreToLevel(score: number): string {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!EXECUTIVE_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const targetId = body?.projectId ? String(body.projectId) : null;

  const forecasts = await prisma.forecastProject.findMany({
    where: targetId ? { id: targetId } : {},
    include: {
      shipments: {
        where: { status: { notIn: ["completed", "cancelled"] } },
        select: {
          id: true, shipmentNumber: true, status: true, vesselName: true,
          eta: true, blDate: true, laycanStart: true,
        },
      },
      deals: {
        where: { status: { notIn: ["cancelled", "rejected"] } },
        select: {
          id: true, dealNumber: true, quantity: true, pricePerMt: true, status: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: targetId ? 1 : 30,
  });

  const [marketPrices] = await Promise.all([
    prisma.marketPrice.findMany({
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const analyzed = [];
  for (const forecast of forecasts) {
    let score = 15;
    const factors: string[] = [];
    const documentGaps: string[] = [];
    const shipmentBlockers: string[] = [];
    const commercialSignals: string[] = [];

    if (forecast.status === "waiting_approval") {
      score += 15;
      factors.push("Forecast Sales masih waiting approval.");
    }

    const activeShipments = forecast.shipments;
    if (activeShipments.length > 0) {
      score += Math.min(25, activeShipments.length * 8);
      factors.push(`${activeShipments.length} shipment aktif terkait Forecast Sales.`);
    }

    const soonestEta = activeShipments
      .map((s) => daysUntil(s.eta || s.blDate || s.laycanStart))
      .filter((d): d is number => d !== null)
      .sort((a, b) => a - b)[0];

    if (soonestEta !== undefined && soonestEta <= 7) {
      score += soonestEta < 0 ? 20 : 12;
      factors.push(
        soonestEta < 0
          ? "Ada shipment melewati ETA/BL date."
          : `Shipment terdekat jatuh tempo dalam ${soonestEta} hari.`
      );
      shipmentBlockers.push(
        ...activeShipments
          .slice(0, 3)
          .map((s) => `${s.shipmentNumber}: ETA ${soonestEta} hari`)
      );
    }

    const query = `${forecast.projectName} ${forecast.buyer} coal shipment`;
    const news = await fetchExternalNews(query);
    const realNews = news.filter((n) => n.source && n.source !== "Mock");
    if (realNews.length > 0) {
      score += Math.min(20, realNews.length * 7);
      factors.push(`Berita eksternal ditemukan: ${realNews.slice(0, 2).map((n) => n.title).join("; ")}.`);
    }

    const requiredDocs = forecast.requiredDocuments
      ? JSON.parse(forecast.requiredDocuments as string)
      : [];
    const missingDocs = requiredDocs.filter((d: { done?: boolean }) => !d.done);
    if (missingDocs.length > 0) {
      const pct = missingDocs.length / requiredDocs.length;
      score += Math.min(22, Math.round(pct * 22));
      documentGaps.push(...missingDocs.slice(0, 6).map((d: { label: string }) => d.label));
      factors.push(`${missingDocs.length}/${requiredDocs.length} required documents belum complete.`);
    }

    const latestMarket = marketPrices[0];
    const benchmark = latestMarket
      ? Number(latestMarket.ici4 ?? latestMarket.ici3 ?? latestMarket.newcastle ?? 0)
      : 0;
    const avgSell = forecast.deals.length
      ? forecast.deals.reduce((s, d) => s + Number(d.pricePerMt ?? 0), 0) / forecast.deals.length
      : Number(forecast.salesPriceEst ?? 0);

    if (benchmark > 0 && avgSell > 0) {
      const spread = avgSell - benchmark;
      commercialSignals.push(
        `Average selling price spread vs benchmark: ${spread >= 0 ? "+" : ""}${spread.toFixed(2)} USD/MT.`
      );
      if (spread < -3) {
        score += 12;
        factors.push("Selling price berada di bawah benchmark market.");
      } else if (spread > 3) {
        commercialSignals.push("Selling price lebih baik dari benchmark.");
      }
    }

    const margin = Number(forecast.roughPl ?? 0) / Number(forecast.quantity ?? 1);
    if (margin < 0) {
      score += 18;
      factors.push("P&L forecast menunjukkan margin negatif.");
    } else if (margin > 5) {
      commercialSignals.push("Margin forecast sehat.");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const level = scoreToLevel(score);
    const recommendedAction =
      level === "HIGH" || level === "CRITICAL"
        ? documentGaps.length > 0
          ? "Prioritaskan Forecast Sales ini: tuntaskan document gaps, assign owner, eskalasi blocker."
          : "Prioritaskan Forecast Sales ini: eskalasi blocker, cek commercial spread."
        : "Monitor normal, jalankan ulang analisis saat data berubah.";

    const report = {
      score,
      level,
      summary: `${forecast.projectName} berada pada level ${level}. Prioritas dihitung dari status approval, shipment aktif, timeline, dokumen, P&L/market signal, berita eksternal.`,
      factors: factors.length ? factors : ["Tidak ada sinyal urgensi tinggi."],
      recommendedAction,
      documentGaps,
      shipmentBlockers,
      commercialSignals: commercialSignals.length ? commercialSignals : ["Belum ada data market/deal yang cukup."],
      decisionMemo: {
        suggestedDecision:
          level === "CRITICAL" ? "HOLD / EXECUTIVE REVIEW" : level === "HIGH" ? "FAST REVIEW" : "MONITOR",
        owner: level === "HIGH" || level === "CRITICAL" ? "CEO / DIRUT / ASS_DIRUT" : "Forecast Sales owner",
        nextStep: recommendedAction,
      },
      relatedShipments: activeShipments.slice(0, 6).map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        status: s.status,
        eta: s.eta,
      })),
      marketSnapshot: latestMarket
        ? {
          date: latestMarket.date,
          ici3: latestMarket.ici3,
          ici4: latestMarket.ici4,
          newcastle: latestMarket.newcastle,
        }
        : null,
      news: realNews.slice(0, 5),
      analyzedAt: new Date().toISOString(),
    };

    await prisma.forecastProject.update({
      where: { id: forecast.id },
      data: {
        urgencyScore: score,
        urgencyLevel: level,
        urgencyReport: report,
        lastUrgencyAnalyzedAt: new Date(),
      },
    });

    analyzed.push({ id: forecast.id, projectName: forecast.projectName, score, level });
  }

  return NextResponse.json({ success: true, projects: analyzed });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const voyage = await prisma.transshipment.findUnique({ where: { id } });
  if (!voyage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: integrate Groq AI for real risk analysis
  // Stub response — simulates AI output
  const insights = [
    {
      category: "Route",
      risk:     "Low",
      detail:   `Route ${voyage.loadingPort ?? "origin"} → ${voyage.dischargePort ?? "destination"}: No major congestion reported.`,
      mitigation: "Monitor port alerts 72h before ETA.",
    },
    {
      category: "Weather",
      risk:     voyage.weather ? "Medium" : "Unknown",
      detail:   voyage.weather ?? "No weather data available. Check BMKG / NWS 48h before sailing.",
      mitigation: "Ensure vessel has adequate ballast for sea conditions.",
    },
    {
      category: "Freight",
      risk:     "Low",
      detail:   `Freight rate ${voyage.freightRate ? `$${Number(voyage.freightRate).toFixed(2)}/MT` : "not set"}.`,
      mitigation: "Lock rate with owner; include demurrage clause.",
    },
  ];

  return NextResponse.json({ data: { insights, generatedAt: new Date().toISOString(), isStub: true } });
}

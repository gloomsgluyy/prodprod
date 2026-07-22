export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── GET: build context index from DB ─────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Build context from live DB data instead of parsing Excel files
  const [shipmentCount, deliveryCount, forecastCount] = await Promise.all([
    prisma.shipment.count(),
    prisma.dailyDeliveryLog.count(),
    prisma.forecastProject.count(),
  ]);

  const recentShipments = await prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { shipmentNumber: true, buyer: true, status: true, qtyFinal: true, blDate: true },
  });

  const context = {
    workbooks: [
      {
        name: "Shipment Monitor",
        description: "Live shipment data from CoalTrade OS database",
        sheets: [
          {
            name: "Active Shipments",
            rows:    shipmentCount,
            columns: 15,
            headers: ["shipmentNumber","buyer","status","qtyPlan","qtyLoaded","qtyFinal","pol","pod","vesselName","bargeName","blDate","source","supplier","marginMt","completionScore"],
          },
        ],
      },
      {
        name: "Daily Delivery Log",
        description: "BL-based delivery records",
        sheets: [
          {
            name: "Delivery Log",
            rows:    deliveryCount,
            columns: 9,
            headers: ["blDate","buyer","supplier","shippingTerm","area","flow","blQty","invoiceAmount","product"],
          },
        ],
      },
      {
        name: "Forecast Sales",
        description: "Sales forecast projects pipeline",
        sheets: [
          {
            name: "Projects",
            rows:    forecastCount,
            columns: 12,
            headers: ["projectName","buyer","buyerCountry","segment","quantity","laycanStart","laycanEnd","status","fcoNumber","specGar","salesPriceEst","marginEst"],
          },
        ],
      },
    ],
    summary: {
      totalFiles:  3,
      totalSheets: 3,
      totalRows:   shipmentCount + deliveryCount + forecastCount,
    },
    recentShipments,
  };

  return NextResponse.json({ data: context });
}

// ── POST: answer question with context ───────────────────────────────────────
const schema = z.object({
  question: z.string().min(1, "Question required"),
  history:  z.array(z.object({
    role:    z.enum(["user","assistant"]),
    content: z.string(),
  })).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { question } = parsed.data;

  // Fetch relevant data based on question keywords
  const q = question.toLowerCase();

  let contextData: string = "";

  if (q.includes("shipment") || q.includes("kapal") || q.includes("vessel") || q.includes("cargo")) {
    const shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        shipmentNumber: true, buyer: true, status: true,
        qtyFinal: true, qtyLoaded: true, qtyPlan: true,
        blDate: true, source: true, supplier: true,
        marginMt: true, pol: true, pod: true,
      },
    });
    contextData = `Active Shipments (latest 20):\n${JSON.stringify(shipments, null, 2)}`;
  } else if (q.includes("delivery") || q.includes("bl") || q.includes("pengiriman")) {
    const deliveries = await prisma.dailyDeliveryLog.findMany({
      orderBy: { blDate: "desc" },
      take: 30,
    });
    contextData = `Daily Delivery Log (latest 30):\n${JSON.stringify(deliveries, null, 2)}`;
  } else if (q.includes("forecast") || q.includes("project") || q.includes("buyer")) {
    const forecasts = await prisma.forecastProject.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        projectName: true, buyer: true, buyerCountry: true,
        quantity: true, status: true, laycanStart: true, laycanEnd: true,
      },
    });
    contextData = `Forecast Projects (latest 20):\n${JSON.stringify(forecasts, null, 2)}`;
  } else {
    // Generic: provide summary stats
    const [ships, deliveries, forecasts] = await Promise.all([
      prisma.shipment.count(),
      prisma.dailyDeliveryLog.count(),
      prisma.forecastProject.count(),
    ]);
    contextData = `Summary: ${ships} shipments, ${deliveries} delivery logs, ${forecasts} forecast projects in system.`;
  }

  // TODO: Replace stub with real Groq API call
  // const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  //   method: "POST",
  //   headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     model: "llama3-70b-8192",
  //     messages: [
  //       { role: "system", content: `You are CoalTrade OS AI Agent. Answer based on this data:\n${contextData}` },
  //       ...history ?? [],
  //       { role: "user", content: question },
  //     ],
  //   }),
  // });

  // Stub response with keyword-based logic
  let answer = "";
  if (q.includes("total") && q.includes("shipment")) {
    const count = await prisma.shipment.count();
    answer = `Total shipments in the system: **${count}**.\n\nBreakdown by status is available in the Shipment Monitor module. Use the filter controls to drill down by date range, buyer, or region.`;
  } else if (q.includes("buyer") && (q.includes("terbesar") || q.includes("biggest") || q.includes("top"))) {
    const buyers = await prisma.shipment.groupBy({
      by: ["buyer"],
      _sum: { qtyFinal: true },
      orderBy: { _sum: { qtyFinal: "desc" } },
      take: 5,
    });
    const list = buyers.map((b, i) => `${i+1}. **${b.buyer}** — ${Number(b._sum.qtyFinal ?? 0).toLocaleString()} MT`).join("\n");
    answer = `Top buyers by total final quantity:\n\n${list}`;
  } else if (q.includes("status") || q.includes("active")) {
    const statuses = await prisma.shipment.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const list = statuses.map((s) => `- **${s.status}**: ${s._count.id}`).join("\n");
    answer = `Shipment count by status:\n\n${list}`;
  } else {
    answer = `📊 Based on your question about "*${question}*":\n\n${contextData.slice(0, 500)}${contextData.length > 500 ? "\n\n*(truncated — full data available in module)*" : ""}\n\n> ⚠️ **Note:** This is a stub response. Groq AI integration is pending. Add \`GROQ_API_KEY\` to enable real AI answers.`;
  }

  return NextResponse.json({
    data: {
      answer,
      isStub: true,
      contextUsed: contextData.slice(0, 100) + "…",
    },
  });
}


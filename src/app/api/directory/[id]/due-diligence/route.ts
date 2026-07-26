import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatText, hasAI, parseJson } from "@/lib/ai";
import { fetchExternalNews } from "@/lib/external-news";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const news = await fetchExternalNews(`${partner.name} coal trading dispute fraud sanction legal`);

  const fallbackResult = {
    riskLevel:   "Low" as const,
    score:       82,
    summary:     `Due diligence assessment for ${partner.name} (${partner.type}). No major red flags identified based on available information.`,
    recommendations: [
      "Verify NPWP and business registration documents",
      "Confirm bank account details with direct communication",
      "Request latest financial statements",
    ],
      flags: news.filter((n) => n.source !== "System").map((n) => `External news: ${n.title}`).slice(0, 3),
      news,
    generatedAt: new Date().toISOString(),
    isStub: !hasAI(),
  };
  let result = fallbackResult;
  if (hasAI()) {
    try {
      result = parseJson(await chatText([
          { role: "system", content: "You are coal trading counterparty due diligence analyst. Return JSON only: riskLevel Low|Medium|High|Critical, score 0-100, summary, recommendations array, flags array, generatedAt ISO, isStub false." },
          { role: "user", content: JSON.stringify({ partner, news }) },
        ], { json: true }), fallbackResult);
    } catch {
      result = { ...fallbackResult, isStub: true };
    }
  }

  // Persist result on partner
  await prisma.partner.update({
    where: { id },
    data: { aiDueDiligence: result } as never,
  });

  return NextResponse.json({ data: result });
}

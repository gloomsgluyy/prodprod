import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: integrate Groq AI for real due diligence
  const stubResult = {
    riskLevel:   "Low" as const,
    score:       82,
    summary:     `Due diligence assessment for ${partner.name} (${partner.type}). No major red flags identified based on available information.`,
    recommendations: [
      "Verify NPWP and business registration documents",
      "Confirm bank account details with direct communication",
      "Request latest financial statements",
    ],
    flags: [] as string[],
    generatedAt: new Date().toISOString(),
    isStub: true,
  };

  // Persist result on partner
  await prisma.partner.update({
    where: { id },
    data: { aiDueDiligence: stubResult } as never,
  });

  return NextResponse.json({ data: stubResult });
}

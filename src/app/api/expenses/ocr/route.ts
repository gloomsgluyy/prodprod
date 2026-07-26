import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatText, hasAI, parseJson } from "@/lib/ai";

type OCRResult = {
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  supplierName?: string;
  notes?: string;
  anomalyFlags?: string[];
  isStub?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl } = await request.json().catch(() => ({}));
  if (!imageUrl || typeof imageUrl !== "string") return NextResponse.json({ error: "imageUrl required" }, { status: 422 });

  const recent = await prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { amount: true, category: true, supplierName: true },
  });
  const avg = recent.length ? recent.reduce((n, e) => n + Number(e.amount), 0) / recent.length : 0;
  const fallback: OCRResult = {
    description: "Receipt / invoice expense",
    currency: "IDR",
    category: "Other",
    notes: "OCR fallback. Configure GROQ_API_KEY or OPENROUTER_API_KEY for image parsing.",
    anomalyFlags: [],
    isStub: true,
  };

  const result = hasAI()
    ? parseJson<OCRResult>(await chatText([
        { role: "system", content: "Extract receipt/invoice fields from image. Return JSON only with description, amount number, currency IDR/USD, category one of Sewa,Supplies,Fuel,Transport,Maintenance,Office,Survey,Legal,Port Charges,Other, supplierName, notes, anomalyFlags array. Mention unclear fields in notes." },
        { role: "user", content: [
          { type: "text", text: `Receipt URL: ${imageUrl}. Recent average expense: ${avg}. Flag anomaly if amount > 2x average or vendor/category mismatch.` },
          { type: "image_url", image_url: { url: imageUrl } },
        ] },
      ], { json: true }), fallback)
    : fallback;

  const flags = result.anomalyFlags ?? [];
  if (result.amount && avg > 0 && result.amount > avg * 2) flags.push(`Amount ${result.amount} > 2x recent average ${Math.round(avg)}`);
  result.anomalyFlags = Array.from(new Set(flags));
  result.isStub = !hasAI();

  return NextResponse.json({ data: result });
}

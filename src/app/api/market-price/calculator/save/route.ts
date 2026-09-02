import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const INDEX_KEYS = [
  "ici1", "ici2", "ici3", "ici4", "ici5", "newcastle",
  "hba", "hba1", "hba2", "hba3",
] as const;

const baseIndexItem = z.object({
  key: z.enum(INDEX_KEYS),
  label: z.string().min(1).max(100),
  weight: z.number().finite().min(0).max(100),
  price: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const schema = z.object({
  calculationType: z.string().min(1).max(50).default("standard_index"),
  baseIndex: z.enum(INDEX_KEYS), baseIndexDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseIndexValue: z.number().positive(),
  baseIndexes: z.array(baseIndexItem).min(1).optional(),
  baseIndexWeights: z.record(z.number().finite().min(0).max(100)).optional(),
  marketPriceSnapshot: z.record(z.unknown()).optional(),
  prorataMethod: z.enum(["simple", "weighted"]),
  baseGar: z.number().finite().optional().nullable(),
  targetGar: z.number().finite().optional().nullable(),
  targetProrataMethod: z.string().max(50).optional().nullable(),
  priceAfterProrata: z.number().finite().optional().nullable(),
  basis: z.string().max(50).optional().nullable(),
  basisAdjustment: z.number().finite().optional().nullable(),
  basisDescription: z.string().max(500).optional().nullable(),
  priceAfterBasis: z.number().finite().optional().nullable(),
  actualTs: z.number().finite().nullable().optional(), contractTs: z.number().finite().nullable().optional(),
  tsAdjustment: z.number().finite().nullable().optional(),
  actualAsh: z.number().finite().nullable().optional(), contractAsh: z.number().finite().nullable().optional(),
  ashAdjustment: z.number().finite().nullable().optional(),
  qualityAdjustment: z.number().finite(), premiumDiscount: z.number().finite(),
  description: z.string().max(500).nullable().optional(), finalPrice: z.number().finite(),
}).superRefine((data, ctx) => {
  if (data.baseIndexes && data.prorataMethod === "weighted") {
    const total = data.baseIndexes.reduce((sum, item) => sum + item.weight, 0);
    if (Math.abs(total - 100) > 0.0001) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["baseIndexes"], message: "Base index weights must total 100%." });
    }
  }
  if (data.baseIndexWeights) {
    const total = Object.values(data.baseIndexWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 100) > 0.0001) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["baseIndexWeights"], message: "Base index weights must total 100%." });
    }
  }
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const item = await prisma.calculationHistory.create({
    data: {
      ...parsed.data,
      baseIndexDate: new Date(`${parsed.data.baseIndexDate}T00:00:00.000Z`),
      description: parsed.data.description || null,
      createdById: session.user.id,
    } as never,
  });
  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "calculation_history", entityId: item.id,
    details: {
      calculationType: item.calculationType,
      baseIndex: item.baseIndex,
      baseIndexDate: parsed.data.baseIndexDate,
      baseIndexes: parsed.data.baseIndexes,
      baseIndexWeights: parsed.data.baseIndexWeights,
      marketPriceSnapshot: parsed.data.marketPriceSnapshot,
      prorataMethod: item.prorataMethod,
      qualityAdjustment: Number(item.qualityAdjustment),
      premiumDiscount: Number(item.premiumDiscount),
      finalPrice: Number(item.finalPrice),
    },
  });
  return NextResponse.json({ data: { id: item.id } }, { status: 201 });
}

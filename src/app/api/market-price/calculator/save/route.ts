import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  baseIndex: z.string().min(1), baseIndexDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseIndexValue: z.number().positive(), prorataMethod: z.string().min(1),
  actualTs: z.number().finite().nullable().optional(), contractTs: z.number().finite().nullable().optional(),
  actualAsh: z.number().finite().nullable().optional(), contractAsh: z.number().finite().nullable().optional(),
  qualityAdjustment: z.number().finite(), premiumDiscount: z.number().finite(),
  description: z.string().max(500).nullable().optional(), finalPrice: z.number().finite(),
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
    },
  });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "created", entity: "calculation_history", entityId: item.id, details: { baseIndex: item.baseIndex, finalPrice: Number(item.finalPrice) } });
  return NextResponse.json({ data: { id: item.id } }, { status: 201 });
}

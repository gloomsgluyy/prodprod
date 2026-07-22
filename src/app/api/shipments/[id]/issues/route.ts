export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const issues = await prisma.shipmentIssue.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      pic:        { select: { id: true, name: true } },
      resolvedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ data: issues });
}

const createSchema = z.object({
  category:       z.enum(["Loading delay","Quality issue","Barge issue","Document issue","Payment issue","Weather","Port issue","Other"]),
  description:    z.string().min(1),
  impact:         z.string().min(1),
  actionPlan:     z.string().min(1),
  picId:          z.string().uuid(),
  targetDate:     z.string(),
  evidenceFileUrl:z.string().url().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const issue = await prisma.shipmentIssue.create({
    data: { shipmentId: id, ...parsed.data, status: "open" },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "issue_created", entity: "shipment", entityId: id, shipmentId: id,
    details: { category: parsed.data.category },
  });

  return NextResponse.json({ data: issue }, { status: 201 });
}

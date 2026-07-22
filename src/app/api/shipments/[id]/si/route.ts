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
  const siList = await prisma.shippingInstruction.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: { approvedBy: { select: { name: true } } },
  });
  return NextResponse.json({ data: siList });
}

const siSchema = z.object({
  buyer:             z.string().min(1),
  supplier:          z.string().min(1),
  source:            z.string().min(1),
  pol:               z.string().min(1),
  pod:               z.string().min(1),
  laycanStart:       z.string(),
  laycanEnd:         z.string(),
  product:           z.string().min(1),
  coalSpec:          z.record(z.unknown()),
  quantity:          z.coerce.number().positive(),
  tolerance:         z.string().optional(),
  vesselBarge:       z.string().min(1),
  contractReference: z.string().min(1),
  documentRequired:  z.string().optional(),
  remarks:           z.string().optional(),
  forecastProjectId: z.string().uuid().optional(),
  isEarly:           z.boolean().default(false),
  earlyReason:       z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = siSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // H-10 check — BR-SHIP-023
  const laycanStart  = new Date(parsed.data.laycanStart);
  const daysTill     = Math.ceil((laycanStart.getTime() - Date.now()) / 86400000);
  const isEarly      = daysTill > 10 ? false : daysTill < 10;

  if (isEarly && !parsed.data.isEarly) {
    return NextResponse.json({
      error: "Early SI: laycan start is less than 10 days away. Set isEarly=true and provide earlyReason + CEO approval.",
      code:  "H10_VIOLATION",
      daysTill,
    }, { status: 409 });
  }

  // Version tracking
  const existing = await prisma.shippingInstruction.findFirst({
    where: { shipmentId: id },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (existing?.version ?? 0) + 1;

  // Auto SI number
  const siNumber = `SI-${id.slice(-6).toUpperCase()}-V${version}`;

  const si = await prisma.shippingInstruction.create({
    data: {
      shipmentId: id,
      siNumber,
      version,
      ...parsed.data,
      coalSpec: parsed.data.coalSpec as never,
      approvalStatus: isEarly ? "pending" : "approved",
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: version === 1 ? "si_issued" : "si_revised",
    entity: "shipment", entityId: id, shipmentId: id,
    details: { siNumber, version, isEarly },
  });

  return NextResponse.json({ data: si }, { status: 201 });
}

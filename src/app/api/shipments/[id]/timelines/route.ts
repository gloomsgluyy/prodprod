export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canMutateShipment } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipment(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canMutateShipment(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({ where: { id }, select: { id: true } });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  const [pol, pod] = await Promise.all([
    prisma.polTimeline.findUnique({ where: { shipmentId: id } }),
    prisma.podTimeline.findUnique({ where: { shipmentId: id } }),
  ]);
  return NextResponse.json({ data: { pol, pod } });
}

const polSchema = z.object({
  arrivePol:       z.string().optional().nullable(),
  norPol:          z.string().optional().nullable(),
  berthing:        z.string().optional().nullable(),
  commenceLoading: z.string().optional().nullable(),
  completeLoading: z.string().optional().nullable(),
  blDate:          z.string().optional().nullable(),
  peb:             z.string().optional().nullable(),
  lhv:             z.string().optional().nullable(),
});

const podSchema = z.object({
  etaPod:            z.string().optional().nullable(),
  arrivePod:         z.string().optional().nullable(),
  norPod:            z.string().optional().nullable(),
  inPosition:        z.string().optional().nullable(),
  dischargeStart:    z.string().optional().nullable(),
  dischargeComplete: z.string().optional().nullable(),
  factoryDate:       z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body  = await request.json();
  const { type, ...rest } = body;

  if (type === "pol") {
    const parsed = polSchema.safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const pol = await prisma.$transaction(async (tx) => {
      const result = await tx.polTimeline.upsert({
      where: { shipmentId: id },
      create: { shipmentId: id, ...parsed.data },
      update: parsed.data,
      });

    // Auto-advance shipment status based on milestones
    if (parsed.data.commenceLoading) {
      await tx.shipment.update({ where: { id }, data: { status: "loading" } });
    }
      if (parsed.data.blDate) {
        await tx.shipment.update({ where: { id }, data: { blDate: new Date(parsed.data.blDate) } });
      }
      return result;
    });

    return NextResponse.json({ data: pol });
  }

  if (type === "pod") {
    const parsed = podSchema.safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    if (parsed.data.etaPod) {
      await prisma.shipment.update({ where: { id }, data: { status: "in_transit", eta: new Date(parsed.data.etaPod) } });
    }

    const pod = await prisma.podTimeline.upsert({
      where: { shipmentId: id },
      create: { shipmentId: id, ...parsed.data },
      update: parsed.data,
    });
    return NextResponse.json({ data: pod });
  }

  return NextResponse.json({ error: "type must be pol or pod" }, { status: 422 });
}

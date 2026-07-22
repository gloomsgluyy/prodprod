import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  blDate:        z.string().optional(),
  buyer:         z.string().min(1).optional(),
  supplier:      z.string().min(1).optional(),
  shippingTerm:  z.string().min(1).optional(),
  area:          z.string().optional(),
  flow:          z.enum(["domestic","export"]).optional(),
  blQty:         z.coerce.number().positive().optional(),
  invoiceAmount: z.coerce.number().positive().optional(),
  product:       z.string().min(1).optional(),
  projectName:   z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const entry = await prisma.dailyDeliveryLog.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: entry });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.dailyDeliveryLog.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

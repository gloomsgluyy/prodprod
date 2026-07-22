import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  mvName: z.string().min(1).optional(), shipmentId: z.string().uuid().optional().nullable(),
  vesselName: z.string().optional(), bargeName: z.string().optional(),
  loadingPort: z.string().optional(), dischargePort: z.string().optional(),
  freightRate: z.coerce.number().positive().optional(), qtyLoaded: z.coerce.number().positive().optional(),
  eta: z.string().optional().nullable(), status: z.enum(["active","completed"]).optional(),
  weather: z.string().optional(), allowance: z.coerce.number().positive().optional(),
  demurrage: z.coerce.number().positive().optional(), despatch: z.coerce.number().positive().optional(),
  pbm: z.coerce.number().positive().optional(), pnbp: z.coerce.number().positive().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.update({ where: { id }, data: parsed.data });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "updated", entity: "transshipment", entityId: id });
  return NextResponse.json({ data: record });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.transshipment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

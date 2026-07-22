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
  const record = await prisma.qualityResult.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

const specSchema = z.object({
  gar: z.coerce.number().positive().optional(),
  nar: z.coerce.number().positive().optional(),
  tm:  z.coerce.number().positive().optional(),
  im:  z.coerce.number().positive().optional(),
  ts:  z.coerce.number().positive().optional(),
  ash: z.coerce.number().positive().optional(),
  vm:  z.coerce.number().positive().optional(),
  hgi: z.coerce.number().positive().optional(),
  adb: z.coerce.number().positive().optional(),
}).optional();

const updateSchema = z.object({
  cargoId:          z.string().min(1).optional(),
  cargoName:        z.string().min(1).optional(),
  shipmentId:       z.string().uuid().optional().nullable(),
  surveyor:         z.string().optional(),
  samplingDate:     z.string().optional().nullable(),
  status:           z.enum(["pending","passed","warning","need_review","claim_potential","rejected","approved"]).optional(),
  specResult:       specSchema,
  contractSpec:     specSchema,
  sourceEstimate:   specSchema,
  qcResult:         specSchema,
  qcDocumentId:     z.string().uuid().optional().nullable(),
  psiResult:        specSchema,
  psiDocumentId:    z.string().uuid().optional().nullable(),
  coaPolResult:     specSchema,
  coaPolDocumentId: z.string().uuid().optional().nullable(),
  coaPodResult:     specSchema,
  coaPodDocumentId: z.string().uuid().optional().nullable(),
  comparisonStatus: z.string().optional(),
  warningNotes:     z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.qualityResult.update({ where: { id }, data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "quality_result", entityId: id,
    details: { status: parsed.data.status },
  });

  return NextResponse.json({ data: record });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.qualityResult.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

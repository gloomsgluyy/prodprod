export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.forecastProject.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      approvals: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      revisions: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      fcoRecords: { orderBy: { generatedAt: "desc" } },
      _count: { select: { shipments: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exec = isExecutive(session.user.role);
  return NextResponse.json({
    data: {
      ...project,
      roughPl:        exec ? project.roughPl        : undefined,
      salesPriceEst:  exec ? project.salesPriceEst  : undefined,
      buyingPriceEst: exec ? project.buyingPriceEst : undefined,
      freightEst:     exec ? project.freightEst     : undefined,
      marginEst:      exec ? project.marginEst      : undefined,
    },
  });
}

const updateSchema = z.object({
  entity:         z.string().optional(),
  offerDate:      z.string().optional(),
  projectName:    z.string().min(1).optional(),
  buyer:          z.string().min(1).optional(),
  buyerCountry:   z.string().optional(),
  attention:      z.string().optional(),
  buyerCode:      z.string().optional(),
  segment:        z.string().optional(),
  quantity:       z.coerce.number().positive().optional(),
  quantityUnit:   z.string().optional(),
  quantityTolerance: z.string().optional(),
  forecastMonth:  z.string().optional(),
  commodity:      z.string().optional(),
  priceBasis:     z.string().optional(),
  paymentTerm:    z.string().optional(),
  surveyor:       z.string().optional(),
  templateType:   z.string().optional(),
  templateChecklist: z.unknown().optional(),
  laycanStart:    z.string().optional(),
  laycanEnd:      z.string().optional(),
  shippingTerm:   z.string().optional(),
  pol:            z.string().optional(),
  pod:            z.string().optional(),
  salesPriceEst:  z.coerce.number().positive().optional(),
  buyingPriceEst: z.coerce.number().positive().optional(),
  freightEst:     z.coerce.number().positive().optional(),
  marginEst:      z.coerce.number().optional(),
  basePriceMethod: z.string().optional(),
  formula:         z.string().optional(),
  averagePeriod:  z.string().optional(),
  applyPriceAdjustment: z.boolean().optional(),
  adjustmentFormula: z.string().optional(),
  rejectionGar:   z.coerce.number().positive().optional(),
  specGar:        z.coerce.number().positive().optional(),
  specNar:        z.coerce.number().positive().optional(),
  specTs:         z.coerce.number().positive().optional(),
  specAsh:        z.coerce.number().positive().optional(),
  specTm:         z.coerce.number().positive().optional(),
  specIm:         z.coerce.number().positive().optional(),
  specVm:         z.coerce.number().positive().optional(),
  specHgi:        z.coerce.number().positive().optional(),
  specSize:       z.string().optional(),
  specStandard:   z.string().optional(),
  specificationSource: z.string().optional(),
  remarks:        z.string().optional(),
  buyerFeedback:  z.string().optional(),
  failedReason:   z.string().optional(),
  failedCategory: z.string().optional(),
  roughPl:        z.record(z.unknown()).optional(),
  validityDate:   z.string().optional(),
  validityTime:   z.string().optional(),
  timezone:       z.string().optional(),
  subjectToCargoUnsold: z.boolean().optional(),
  calculationHistoryId: z.string().uuid().optional(),
  calculatorSnapshot: z.record(z.unknown()).optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const before = await prisma.forecastProject.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await prisma.forecastProject.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.offerDate ? { offerDate: new Date(`${parsed.data.offerDate}T00:00:00.000Z`) } : {}),
      ...(parsed.data.validityDate ? { validityDate: new Date(`${parsed.data.validityDate}T00:00:00.000Z`) } : {}),
    } as never,
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "forecast_project", entityId: id, projectId: id,
  });

  return NextResponse.json({ data: project });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only draft can be deleted
  if (project.status !== "draft")
    return NextResponse.json({ error: "Only draft projects can be deleted" }, { status: 409 });

  await prisma.forecastProject.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "deleted", entity: "forecast_project", entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}

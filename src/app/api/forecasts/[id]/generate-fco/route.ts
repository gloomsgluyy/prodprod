export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { generateFcoPdf } from "@/lib/pdf-generator";
import { saveFile } from "@/lib/storage";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Allowed only for approved projects — SRS CP-04, E2E-05
const ALLOWED_STATUSES = ["approved", "deal"];

const schema = z.object({
  action: z.enum(["generate","resend","revise"]).default("generate"),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!ALLOWED_STATUSES.includes(project.status))
    return NextResponse.json({ error: `Cannot generate FCO for status: ${project.status}` }, { status: 409 });

  // Determine FCO number and version
  const existingFcos = await prisma.fCORecord.count({ where: { forecastProjectId: id } });
  const version = existingFcos + 1;
  const fcoNumber = project.fcoNumber ?? `FCO-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;

  // Record generation event
  const fcoRecord = await prisma.fCORecord.create({
    data: {
      forecastProjectId: id,
      fcoNumber,
      version,
      action: parsed.data.action,
      generatedBy: session.user.id,
    },
  });

  // Update project with latest FCO metadata
  await prisma.forecastProject.update({
    where: { id },
    data: { fcoNumber, fcoVersion: version },
  });

  // Generate PDF server-side and persist — SRS Gate D
  let pdfUrl: string | null = null;
  let objectKey: string | null = null;
  try {
    const pjt = project as Record<string, unknown>;
    const pdfBytes = await generateFcoPdf({
      fcoNumber,
      version,
      projectName:   project.projectName,
      buyer:         project.buyer,
      buyerCountry:  project.buyerCountry ?? undefined,
      commodity:     pjt.commodity as string | undefined,
      quantity:      project.quantity ? Number(project.quantity) : undefined,
      quantityUnit:  project.quantityUnit,
      laycanStart:   project.laycanStart?.toISOString().split("T")[0],
      laycanEnd:     project.laycanEnd?.toISOString().split("T")[0],
      pol:           project.pol ?? undefined,
      salesPrice:    project.salesPriceEst ? Number(project.salesPriceEst) : undefined,
      priceBasis:    pjt.priceBasis as string | undefined,
      paymentTerm:   pjt.paymentTerm as string | undefined,
      surveyorName:  pjt.surveyor as string | undefined,
      shippingTerm:  project.shippingTerm ?? undefined,
      specGar:       project.specGar ? Number(project.specGar) : undefined,
      specTs:        project.specTs ? Number(project.specTs) : undefined,
      specAsh:       project.specAsh ? Number(project.specAsh) : undefined,
      specTm:        project.specTm ? Number(project.specTm) : undefined,
      generatedBy:   project.createdBy.name,
      generatedDate: new Date().toISOString().split("T")[0],
    });

    const saved = await saveFile(Buffer.from(pdfBytes), `fco/${id}`, `${fcoNumber}_v${version}.pdf`);
    pdfUrl = saved.publicUrl;
    objectKey = saved.objectKey;

    // Update FCORecord with pdfUrl
    await prisma.fCORecord.update({
      where: { id: fcoRecord.id },
      data: { pdfUrl },
    });

    // Register in GeneratedDocument table for Document Drive
    await prisma.generatedDocument.create({
      data: {
        type: "fco",
        sourceModule: "forecast",
        sourceEntityId: id,
        forecastProjectId: id,
        number: fcoNumber,
        version,
        title: `FCO ${fcoNumber} v${version} — ${project.projectName}`,
        pdfUrl,
        objectKey,
        storageProvider: "local",
        visibility: "internal",
        generatedById: session.user.id,
        status: "generated",
        metadata: {
          action:      parsed.data.action,
          buyer:       project.buyer,
          projectName: project.projectName,
        },
      },
    });
  } catch (pdfErr) {
    console.error("[FCO] PDF generation failed:", pdfErr);
    return NextResponse.json({ error: "FCO PDF generation failed" }, { status: 500 });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "generated_fco", entity: "forecast_project",
    entityId: id, projectId: id,
    details: { fcoNumber, version, action: parsed.data.action, pdfGenerated: !!pdfUrl },
  });

  return NextResponse.json({
    data: {
      fcoRecordId:  fcoRecord.id,
      fcoNumber,
      version,
      projectId:    id,
      projectName:  project.projectName,
      generatedBy:  project.createdBy.name,
      pdfUrl,
    },
  });
}

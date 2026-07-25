/**
 * Summary Report generator for a Forecast Sales project.
 * Route: POST /api/forecasts/[id]/summary-report
 *
 * Queries project + supplier candidates + approval history,
 * generates a PDF via generateSummaryPdf(), saves to local storage,
 * and creates a GeneratedDocument record for the Document Drive.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummaryPdf } from "@/lib/pdf-generator";
import { saveFile } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Load all needed data in parallel
  const [project, candidates, approvals] = await Promise.all([
    prisma.forecastProject.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.forecastSupplierCandidate.findMany({
      where: { forecastProjectId: id },
      orderBy: [{ selected: "desc" }, { createdAt: "asc" }],
    }),
    prisma.forecastApproval.findMany({
      where: { projectId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!project)
    return NextResponse.json({ error: "Forecast project not found" }, { status: 404 });

  const pjt = project as Record<string, unknown>;

  const pdfBytes = await generateSummaryPdf({
    projectName:   project.projectName,
    buyer:         project.buyer,
    commodity:     pjt.commodity as string | undefined,
    quantity:      project.quantity ? Number(project.quantity) : undefined,
    salesPrice:    project.salesPriceEst ? Number(project.salesPriceEst) : undefined,
    buyingPrice:   project.buyingPriceEst ? Number(project.buyingPriceEst) : undefined,
    laycanStart:   project.laycanStart?.toISOString().split("T")[0],
    laycanEnd:     project.laycanEnd?.toISOString().split("T")[0],
    pol:           project.pol ?? undefined,
    status:        project.status,
    forecastMonth: pjt.forecastMonth as string | undefined,
    priceBasis:    pjt.priceBasis as string | undefined,
    paymentTerm:   pjt.paymentTerm as string | undefined,
    traders:       project.createdBy.name,
    specGar:       project.specGar ? Number(project.specGar) : undefined,
    specTs:        project.specTs ? Number(project.specTs) : undefined,
    specAsh:       project.specAsh ? Number(project.specAsh) : undefined,
    specTm:        project.specTm ? Number(project.specTm) : undefined,
    candidates: candidates.map((c) => ({
      supplierName: c.supplierName,
      origin:       c.origin ?? undefined,
      stockMt:      c.stockMt ? Number(c.stockMt) : undefined,
      priceUsd:     c.priceUsd ? Number(c.priceUsd) : undefined,
      selected:     c.selected,
      gar:          c.gar ? Number(c.gar) : undefined,
    })),
    roughPl: project.roughPl
      ? (project.roughPl as Record<string, number>)
      : undefined,
    approvalHistory: approvals.map((a) => ({
      status:    a.status,
      comment:   a.comment ?? undefined,
      userName:  a.user.name,
      createdAt: a.createdAt.toISOString().split("T")[0],
    })),
    generatedDate: new Date().toISOString().split("T")[0],
    generatedBy:   session.user.name ?? session.user.id,
  });

  const reportName = `Summary_${project.projectName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const { publicUrl, objectKey } = await saveFile(
    Buffer.from(pdfBytes),
    `summary/${id}`,
    reportName
  );

  const genDoc = await prisma.generatedDocument.create({
    data: {
      type: "summary",
      sourceModule: "forecast",
      sourceEntityId: id,
      forecastProjectId: id,
      title: `Summary Report — ${project.projectName}`,
      pdfUrl: publicUrl,
      objectKey,
      storageProvider: "local",
      visibility: "internal",
      generatedById: session.user.id,
      status: "generated",
      metadata: {
        buyer:       project.buyer,
        status:      project.status,
        candidates:  candidates.length,
      },
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "generated_summary_report", entity: "forecast_project",
    entityId: id, projectId: id,
    details: { reportName, generatedDocId: genDoc.id },
  });

  return NextResponse.json({
    data: {
      generatedDocId: genDoc.id,
      pdfUrl: publicUrl,
      title: genDoc.title,
    },
  }, { status: 201 });
}

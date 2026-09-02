export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { saveFile } from "@/lib/storage";
import { renderFcoDocx, resolveFcoTemplate, fcoTemplateName, type FcoTemplateProfile } from "@/lib/fco-template";
import { nextFcoNumber } from "@/lib/fco-number";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Allowed only for approved projects — SRS CP-04, E2E-05
const ALLOWED_STATUSES = ["approved", "deal"];

const schema = z.object({
  action: z.enum(["generate","resend","revise"]).default("generate"),
  templateProfile: z.enum(["mse", "camaraderie"]).optional(),
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
  const templateProfile = parsed.data.templateProfile ?? resolveFcoTemplate(project.entity, project.segment);
  const fcoNumber = project.fcoNumber ?? await nextFcoNumber(templateProfile, project.buyer);

  // Record generation event
  const fcoRecord = await prisma.fCORecord.create({
    data: {
      forecastProjectId: id,
      fcoNumber,
      version,
      action: parsed.data.action,
      generatedBy: session.user.id,
      templateProfile,
      templateFile: fcoTemplateName(templateProfile),
    },
  });

  // Update project with latest FCO metadata
  await prisma.forecastProject.update({
    where: { id },
    data: { fcoNumber, fcoVersion: version },
  });

  // Render the approved Forecast into the client-provided DOCX master.
  let docxUrl: string | null = null;
  let objectKey: string | null = null;
  try {
    const pjt = project as Record<string, unknown>;
    const profile: FcoTemplateProfile = templateProfile;
    const docx = await renderFcoDocx(profile, {
      "Quezon Power (Philippines), Limited Co.": project.buyer,
      "Global Transit": project.buyer,
      "Mr. Francis Guevarra": project.attention ?? "",
      "Mr. Daren Lee": project.attention ?? "",
      "Indonesian Steam Coal": pjt.commodity as string ?? "Indonesian Steam Coal",
      "75,000 Metric Tons �10%": project.quantity ? `${Number(project.quantity).toLocaleString()} Metric Tons +/-${project.quantityTolerance ?? "10%"}` : "",
      "70,000MT +/-10%": project.quantity ? `${Number(project.quantity).toLocaleString()}MT +/-${project.quantityTolerance ?? "10%"}` : "",
      "FCO.C2603-QPPL": fcoNumber,
      "26007/FCOE/VIII/2026": fcoNumber,
      "May 26, 2026": new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      "10 August 2026": new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      "August 2026": project.laycanStart && project.laycanEnd ? `${project.laycanStart.toLocaleDateString("en-GB", { month: "long" })} ${project.laycanStart.getFullYear()}` : "",
      "24 August - 5 Sept 2026": project.laycanStart && project.laycanEnd ? `${project.laycanStart.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} - ${project.laycanEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "",
      "Bunati Anchorage, South Kalimantan, Indonesia": project.pol ?? "",
      "Tarahan Port or Tanjung Kampeh Anchorage, South Sumatera, Indonesia": project.pol ?? "",
      "As per mutually agreed": project.remarks ?? "As per mutually agreed",
      "As per previous contract": project.remarks ?? "As per previous contract",
      "Indonesia": "Indonesia",
    });
    const savedDocx = await saveFile(Buffer.from(docx), `fco/${id}`, `${fcoNumber}_v${version}.docx`);
    docxUrl = savedDocx.publicUrl;
    objectKey = savedDocx.objectKey;

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
        pdfUrl: null,
        docxUrl,
        objectKey,
        storageProvider: "local",
        visibility: "internal",
        generatedById: session.user.id,
        status: "generated",
        metadata: {
          action:      parsed.data.action,
          templateProfile,
          templateFile: fcoTemplateName(templateProfile),
          buyer:       project.buyer,
          projectName: project.projectName,
        },
      },
    });
  } catch (docxErr) {
    console.error("[FCO] DOCX generation failed:", docxErr);
    return NextResponse.json({ error: "FCO DOCX generation failed" }, { status: 500 });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "generated_fco", entity: "forecast_project",
    entityId: id, projectId: id,
        details: { fcoNumber, version, action: parsed.data.action, templateProfile, templateFile: fcoTemplateName(templateProfile), docxGenerated: !!docxUrl },
  });

  return NextResponse.json({
    data: {
      fcoRecordId:  fcoRecord.id,
      fcoNumber,
      version,
      projectId:    id,
      projectName:  project.projectName,
      generatedBy:  project.createdBy.name,
       docxUrl,
    },
  });
}

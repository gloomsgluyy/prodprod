import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Allowed only for approved / deal / waiting_approval projects
const ALLOWED_STATUSES = ["approved","waiting_approval","deal","submitted","revision"];

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

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "generated_fco", entity: "forecast_project",
    entityId: id, projectId: id,
    details: { fcoNumber, version, action: parsed.data.action },
  });

  // Return metadata — client generates the actual PDF with jsPDF
  return NextResponse.json({
    data: {
      fcoRecordId: fcoRecord.id,
      fcoNumber,
      version,
      projectId: id,
      projectName: project.projectName,
      generatedBy: project.createdBy.name,
    },
  });
}

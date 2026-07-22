import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  changes: z.array(z.object({
    field:    z.string(),
    label:    z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })).min(1),
  reason:  z.string().min(1),
  updates: z.record(z.unknown()).optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { changes, reason, updates } = parsed.data;

  const [updatedProject] = await prisma.$transaction([
    prisma.forecastProject.update({
      where: { id },
      data: {
        status: "revision",
        ...(updates as Record<string, unknown>),
      },
    }),
    prisma.forecastRevision.create({
      data: {
        forecastProjectId: id,
        changes: changes as never,
        reason,
        statusAtChange: project.status,
        userId: session.user.id,
      },
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "revised", entity: "forecast_project",
    entityId: id, projectId: id,
    details: { reason, changeCount: changes.length },
  });

  return NextResponse.json({ data: updatedProject });
}

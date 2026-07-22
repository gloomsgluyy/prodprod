export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Forecast Sales document checklist — stored as JSON on the project roughPl field
// We use a dedicated pattern: store checklist in a project-level JSON column
// Since schema has roughPl as Json, we'll use a separate approach:
// Store checklist items in the `remarks` field as JSON if no dedicated column exists.
// Better: use shipmentDocument table with shipmentId = null and a reference via entityId pattern.
// Simplest minimal approach: store in ForecastProject.remarks as JSON array.

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.forecastProject.findUnique({
    where: { id },
    select: { id: true, remarks: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Parse checklist from remarks JSON if it starts with "CHECKLIST:"
  let checklist: unknown[] = [];
  if (project.remarks?.startsWith("CHECKLIST:")) {
    try { checklist = JSON.parse(project.remarks.slice(10)); } catch { checklist = []; }
  }

  return NextResponse.json({ data: checklist });
}

const itemSchema = z.object({
  code:       z.string().min(1),
  label:      z.string().min(1),
  owner:      z.string().optional(),
  required:   z.boolean().default(true),
  done:       z.boolean().default(false),
  fileUrl:    z.string().url().optional(),
  uploadedBy: z.string().optional(),
  uploadedAt: z.string().optional(),
  notes:      z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id }, select: { remarks: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let checklist: Record<string, unknown>[] = [];
  if (project.remarks?.startsWith("CHECKLIST:")) {
    try { checklist = JSON.parse(project.remarks.slice(10)); } catch { checklist = []; }
  }

  const newItem = { ...parsed.data, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() };
  checklist.push(newItem);

  await prisma.forecastProject.update({
    where: { id },
    data: { remarks: `CHECKLIST:${JSON.stringify(checklist)}` },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "document_added", entity: "forecast_project", entityId: id, projectId: id,
    details: { code: parsed.data.code, label: parsed.data.label },
  });

  return NextResponse.json({ data: newItem }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json(); // { itemId, ...updates }
  const { itemId, ...updates } = body;
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id }, select: { remarks: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let checklist: Record<string, unknown>[] = [];
  if (project.remarks?.startsWith("CHECKLIST:")) {
    try { checklist = JSON.parse(project.remarks.slice(10)); } catch { checklist = []; }
  }

  const idx = checklist.findIndex((i) => i.id === itemId);
  if (idx === -1) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  checklist[idx] = { ...checklist[idx], ...updates, updatedAt: new Date().toISOString() };

  await prisma.forecastProject.update({
    where: { id },
    data: { remarks: `CHECKLIST:${JSON.stringify(checklist)}` },
  });

  return NextResponse.json({ data: checklist[idx] });
}

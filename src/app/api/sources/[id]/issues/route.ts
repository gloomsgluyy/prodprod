export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  category:         z.enum(["Legal issue","Stock shortage","Quality issue","Hauling issue","Cargo readiness","Price dispute","Force majeure","Other"]),
  title:            z.string().min(1),
  description:      z.string().min(1),
  impact:           z.string().min(1),
  severity:         z.enum(["critical","warning","info"]),
  picName:          z.string().optional(),
  evidenceFileUrl:  z.string().url().optional(),
  linkedShipmentIds:z.array(z.string().uuid()).optional(),
});

const updateSchema = z.object({
  status:          z.enum(["open","in_progress","resolved","closed"]),
  resolutionNotes: z.string().optional(),
  resolvedDate:    z.string().optional(),
});

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const issues = await prisma.sourceIssue.findMany({
    where:   { sourceId: id },
    orderBy: { reportedDate: "desc" },
    include: { reportedBy: { select: { name: true, role: true } } },
  });
  return NextResponse.json({ data: issues });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const source = await prisma.source.findUnique({ where: { id }, select: { id: true } });
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const issue = await prisma.sourceIssue.create({
    data: {
      ...parsed.data,
      sourceId:     id,
      reportedById: session.user.id,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "source_issue_created", entity: "source", entityId: id,
    details: { issueId: issue.id, severity: parsed.data.severity, category: parsed.data.category },
  });

  return NextResponse.json({ data: issue }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params; // sourceId
  const body   = await request.json();
  const { issueId, ...rest } = body;
  if (!issueId) return NextResponse.json({ error: "issueId required" }, { status: 422 });

  const parsed = updateSchema.safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const issue = await prisma.sourceIssue.update({
    where: { id: issueId },
    data: {
      status:          parsed.data.status,
      resolutionNotes: parsed.data.resolutionNotes,
      resolvedDate:    parsed.data.resolvedDate ? new Date(parsed.data.resolvedDate) : undefined,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "source_issue_updated", entity: "source", entityId: id,
    details: { issueId, status: parsed.data.status },
  });

  return NextResponse.json({ data: issue });
}

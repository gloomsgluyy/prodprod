export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const actionPointSchema = z.object({
  description:  z.string().min(1),
  pic:          z.string().min(1),
  dueDate:      z.string().optional(),
  status:       z.enum(["open","in_progress","done"]).default("open"),
  linkedTaskId: z.string().uuid().optional().nullable(),
});

type ActionPoint = z.infer<typeof actionPointSchema> & { id: string; createdAt: string; updatedAt?: string };

function getActionPoints(raw: unknown): ActionPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw as ActionPoint[];
}

// GET — list action points
export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { extractedTasks: true }, // re-using extractedTasks field to store action points
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Action points stored in a dedicated JSON field — we extend Meeting via extractedTasks
  // but separately identifiable by prefix. Since schema has no dedicated field,
  // we store them in a separate metadata approach using the meeting's `momContent` prefix trick.
  // Simplest: use meeting.extractedTasks shaped JSON keyed by "actionPoints".
  const stored = meeting.extractedTasks as Record<string, unknown> | null;
  const points = Array.isArray(stored) ? [] : getActionPoints((stored as Record<string, unknown> | null)?.actionPoints);

  return NextResponse.json({ data: points });
}

// POST — add new action point
export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = actionPointSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { extractedTasks: true },
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stored = meeting.extractedTasks as Record<string, unknown> | null;
  const points: ActionPoint[] = Array.isArray(stored) ? [] : getActionPoints((stored as Record<string, unknown> | null)?.actionPoints);

  const newPoint: ActionPoint = {
    ...parsed.data,
    id:        crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  points.push(newPoint);

  // Preserve existing extracted tasks array separately if needed
  const existing = Array.isArray(stored) ? stored : (stored as Record<string, unknown> | null)?.tasks;
  await prisma.meeting.update({
    where: { id },
    data: {
      extractedTasks: { tasks: existing ?? [], actionPoints: points } as never,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "action_point_added", entity: "meeting", entityId: id,
    details: { description: parsed.data.description, pic: parsed.data.pic },
  });

  return NextResponse.json({ data: newPoint }, { status: 201 });
}

// PATCH — update action point (status, linkedTaskId, etc.)
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pointId, ...updates } = await request.json();
  if (!pointId) return NextResponse.json({ error: "pointId required" }, { status: 422 });

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { extractedTasks: true },
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stored = meeting.extractedTasks as Record<string, unknown> | null;
  const existing = Array.isArray(stored) ? stored : (stored as Record<string, unknown> | null)?.tasks;
  const points: ActionPoint[] = Array.isArray(stored) ? [] : getActionPoints((stored as Record<string, unknown> | null)?.actionPoints);

  const idx = points.findIndex((p) => p.id === pointId);
  if (idx === -1) return NextResponse.json({ error: "Action point not found" }, { status: 404 });

  points[idx] = { ...points[idx], ...updates, updatedAt: new Date().toISOString() };

  // If "Promote to Task" — create Task and store linkedTaskId
  if (updates.promoteToTask && !points[idx].linkedTaskId) {
    const task = await prisma.task.create({
      data: {
        title:        points[idx].description,
        priority:     "high",
        status:       "todo",
        dueDate:      points[idx].dueDate ? new Date(points[idx].dueDate!) : undefined,
        relatedModule:"meeting",
        relatedId:    id,
        createdById:  session.user.id,
      },
    });
    points[idx].linkedTaskId = task.id;
  }

  await prisma.meeting.update({
    where: { id },
    data: { extractedTasks: { tasks: existing ?? [], actionPoints: points } as never },
  });

  return NextResponse.json({ data: points[idx] });
}

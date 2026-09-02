export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canMutateTask } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: meeting });
}

const updateSchema = z.object({
  title:             z.string().min(1).optional(),
  scheduledAt:       z.string().optional(),
  location:          z.string().optional(),
  participants:      z.array(z.string()).optional(),
  agenda:            z.string().optional(),
  status:            z.enum(["scheduled","in_progress","completed"]).optional(),
  momContent:        z.string().optional(),
  momPdfUrl:         z.string().url().optional().nullable(),
  audioUrl:          z.string().url().optional().nullable(),
  videoUrl:          z.string().url().optional().nullable(),
  transcription:     z.string().optional(),
  // FR-MTG-009: link to shipment or project
  linkedShipmentId:  z.string().uuid().optional().nullable(),
  linkedProjectId:   z.string().uuid().optional().nullable(),
  // FR-MTG-010: action points stored as JSON
  actionPoints:      z.array(z.object({
    id:           z.string().optional(),
    description:  z.string().min(1),
    pic:          z.string().min(1),
    dueDate:      z.string().optional(),
    status:       z.enum(["open","in_progress","done"]).default("open"),
    linkedTaskId: z.string().uuid().optional().nullable(),
  })).optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateTask(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const meeting = await prisma.meeting.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: meeting });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateTask(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.meeting.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

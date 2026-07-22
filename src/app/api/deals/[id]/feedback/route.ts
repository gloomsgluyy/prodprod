export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Feedback stored as JSON in deal.notes field prefixed with "FEEDBACK:"
// This avoids a schema migration while keeping the data accessible.

function parseFeedback(notes: string | null): Record<string, unknown>[] {
  if (!notes?.startsWith("FEEDBACK:")) return [];
  try { return JSON.parse(notes.slice(9)); } catch { return []; }
}

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id }, select: { notes: true } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: parseFeedback(deal.notes) });
}

const createSchema = z.object({
  feedbackDate:     z.string().optional(),
  feedbackType:     z.enum(["positive", "negative", "neutral", "counter_offer", "request_revision", "accepted", "rejected"]),
  feedbackChannel:  z.enum(["email", "whatsapp", "phone", "meeting", "formal_letter"]).optional(),
  summary:          z.string().min(1),
  buyerResponse:    z.string().optional(),
  followUpAction:   z.string().optional(),
  followUpDueDate:  z.string().optional(),
  followUpPic:      z.string().optional(),
  status:           z.enum(["open", "follow_up_pending", "closed"]).default("open"),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const deal = await prisma.deal.findUnique({ where: { id }, select: { notes: true, projectName: true } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = parseFeedback(deal.notes);
  const newEntry = {
    ...parsed.data,
    id:          crypto.randomUUID(),
    recordedBy:  session.user.name,
    recordedById:session.user.id,
    feedbackDate:parsed.data.feedbackDate ?? new Date().toISOString().split("T")[0],
    createdAt:   new Date().toISOString(),
  };
  entries.unshift(newEntry); // newest first

  await prisma.deal.update({
    where: { id },
    data: { notes: `FEEDBACK:${JSON.stringify(entries)}` },
  });

  // Auto-create task if follow-up action specified (BR-SAL-006)
  if (parsed.data.followUpAction) {
    await prisma.task.create({
      data: {
        title:        `Follow up: ${parsed.data.followUpAction}`,
        description:  `From buyer feedback on deal: ${deal.projectName}`,
        priority:     "high",
        status:       "todo",
        dueDate:      parsed.data.followUpDueDate ? new Date(parsed.data.followUpDueDate) : undefined,
        relatedModule:"deal",
        relatedId:    id,
        createdById:  session.user.id,
      },
    });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "feedback_added", entity: "deal", entityId: id,
    details: { feedbackType: parsed.data.feedbackType, summary: parsed.data.summary },
  });

  return NextResponse.json({ data: newEntry }, { status: 201 });
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { entryId, ...updates } = await request.json();
  if (!entryId) return NextResponse.json({ error: "entryId required" }, { status: 422 });

  const deal = await prisma.deal.findUnique({ where: { id }, select: { notes: true } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = parseFeedback(deal.notes);
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };

  await prisma.deal.update({
    where: { id },
    data: { notes: `FEEDBACK:${JSON.stringify(entries)}` },
  });

  return NextResponse.json({ data: entries[idx] });
}

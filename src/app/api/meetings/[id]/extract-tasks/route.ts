import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

interface ExtractedTask {
  title:        string;
  description?: string;
  assigneeHint: string;
  dueDate?:     string;
  priority:     "urgent" | "high" | "medium" | "low";
}

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!meeting.momContent && !meeting.transcription)
    return NextResponse.json({ error: "No MOM content or transcription to extract from" }, { status: 409 });

  // TODO: integrate Groq AI for real task extraction from MOM/transcription
  const stubTasks: ExtractedTask[] = [
    {
      title:        "Follow up shipment SHP-001 closing checklist",
      assigneeHint: meeting.participants?.[1] ?? "Traffic Team",
      dueDate:      new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority:     "high",
    },
    {
      title:        "Prepare Q3 forecast submission",
      assigneeHint: meeting.participants?.[0] ?? "Commercial Team",
      dueDate:      new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      priority:     "medium",
    },
    {
      title:        "Update source status report",
      assigneeHint: "Sourcing Team",
      priority:     "medium",
    },
  ];

  // Store extracted tasks on meeting for UI confirmation before creating
  await prisma.meeting.update({
    where: { id },
    data: {
      extractedTasks: stubTasks as never,
      taskExtractionStatus: "extracted",
    },
  });

  return NextResponse.json({ data: { tasks: stubTasks, isStub: true } });
}

// Confirm and create tasks from extraction
export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const tasks: ExtractedTask[] = body.tasks ?? [];

  if (tasks.length === 0)
    return NextResponse.json({ error: "No tasks provided" }, { status: 422 });

  // Create tasks in DB
  const created = await Promise.all(
    tasks.map((t) =>
      prisma.task.create({
        data: {
          title:       t.title,
          description: t.description,
          priority:    t.priority,
          status:      "todo",
          dueDate:     t.dueDate ? new Date(t.dueDate) : undefined,
          relatedModule: "meeting",
          relatedId:   id,
          createdById: session.user.id,
        },
      })
    )
  );

  await prisma.meeting.update({
    where: { id },
    data: { taskExtractionStatus: "confirmed" },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "extracted_tasks", entity: "meeting", entityId: id,
    details: { count: created.length },
  });

  return NextResponse.json({ data: created });
}

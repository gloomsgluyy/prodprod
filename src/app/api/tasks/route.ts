export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 50; // Tasks module shows more at once

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status    = searchParams.get("status");
  const priority  = searchParams.get("priority");
  const mine      = searchParams.get("mine") === "true";
  const search    = searchParams.get("search") ?? "";

  const where = {
    ...(status   && status   !== "all" ? { status:   status   as never } : {}),
    ...(priority && priority !== "all" ? { priority: priority as never } : {}),
    ...(mine ? { assigneeId: session.user.id } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, title: true, description: true, status: true, priority: true,
        dueDate: true, relatedModule: true, relatedId: true, createdAt: true,
        assignee:   { select: { id: true, name: true } },
        createdBy:  { select: { id: true, name: true } },
        _count:     { select: { comments: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  title:         z.string().min(1, "Required"),
  description:   z.string().optional().nullable(),
  priority:      z.enum(["low","medium","high","urgent"]).default("medium"),
  status:        z.enum(["todo","in_progress","review","done"]).default("todo"),
  assigneeId:    z.string().uuid().or(z.literal("")).optional().nullable().transform((v) => v === "" ? null : v ?? null),
  dueDate:       z.string().optional().nullable().transform((v) => v === "" ? null : v ?? null),
  relatedModule: z.string().optional().nullable(),
  relatedId:     z.string().uuid().or(z.literal("")).optional().nullable().transform((v) => v === "" ? null : v ?? null),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const task = await prisma.task.create({
    data: { ...parsed.data, createdById: session.user.id },
    include: { assignee: { select: { id: true, name: true } } },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "task", entityId: task.id,
    details: { title: task.title },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}


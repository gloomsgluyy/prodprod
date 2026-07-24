import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title:         z.string().min(1).optional(),
  description:   z.string().optional().nullable(),
  priority:      z.enum(["low","medium","high","urgent"]).optional(),
  status:        z.enum(["todo","in_progress","review","done"]).optional(),
  assigneeId:    z.string().optional().nullable().transform((v) => !v || v.trim() === "" ? null : v.trim()),
  dueDate:       z.string().optional().nullable().transform((v) => !v || v.trim() === "" ? null : v.trim()),
  relatedModule: z.string().optional().nullable(),
  relatedId:     z.string().optional().nullable().transform((v) => !v || v.trim() === "" ? null : v.trim()),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const dataToUpdate = { ...parsed.data };
  if (dataToUpdate.assigneeId) {
    const userExists = await prisma.user.findUnique({ where: { id: dataToUpdate.assigneeId } });
    if (!userExists) dataToUpdate.assigneeId = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data:  dataToUpdate,
    include: { assignee: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ data: task });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "deleted", entity: "task", entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}

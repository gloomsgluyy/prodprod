import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canMutateTask } from "@/lib/roles";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["todo","in_progress","review","done"]),
});

async function handleUpdateStatus(request: Request, paramsPromise: Promise<{ id: string }>) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateTask(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await paramsPromise;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const task = await prisma.task.update({
    where: { id },
    data:  { status: parsed.data.status },
    select: { id: true, status: true },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "status_changed", entity: "task", entityId: id,
    details: { status: parsed.data.status },
  });

  return NextResponse.json({ data: task });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return handleUpdateStatus(request, params);
}

export async function PUT(request: Request, { params }: Ctx) {
  return handleUpdateStatus(request, params);
}

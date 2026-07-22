import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const APPROVER_ROLES = ["CEO","DIRUT","ASS_DIRUT","COO","TRAFFIC_HEAD","FINANCE"];

const schema = z.object({
  action:  z.enum(["approved","rejected"]),
  notes:   z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (expense.status !== "submitted")
    return NextResponse.json({ error: "Only submitted expenses can be approved/rejected" }, { status: 409 });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status:      parsed.data.action as never,
      approvedById:session.user.id,
      approvedAt:  new Date(),
      notes:       parsed.data.notes ?? expense.notes,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: parsed.data.action, entity: "expense", entityId: id,
    details: { notes: parsed.data.notes },
  });

  return NextResponse.json({ data: updated });
}

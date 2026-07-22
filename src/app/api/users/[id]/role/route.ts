import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_CALLER_ROLES = ["CEO", "DIRUT"];

const schema = z.object({
  role: z.enum([
    "CEO","DIRUT","ASS_DIRUT","COO","CMO","CPPO",
    "TRADERS_1","TRADERS_2","TRADERS_3","TRADERS_4","JUNIOR_TRADER",
    "ADMIN_MARKETING","TRAFFIC_HEAD","TRAFFIC_1","TRAFFIC_2","TRAFFIC_3","TRAFFIC_4",
    "ADMIN_OPERATION","SPV_SOURCING","SOURCING_1","SOURCING_2","SOURCING_3","SOURCING_4",
    "QQ_MANAGER","QC_MANAGER","QC_ADMIN_1","QC_ADMIN_2","FINANCE","STAFF",
  ]),
});

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_CALLER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden — only CEO/DIRUT can change roles" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const before = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent demoting oneself accidentally
  if (id === session.user.id && parsed.data.role !== session.user.role)
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 409 });

  const user = await prisma.user.update({
    where: { id },
    data:  { role: parsed.data.role as never },
    select: { id: true, name: true, email: true, role: true },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "role_changed", entity: "user", entityId: id,
    details: { from: before.role, to: parsed.data.role, userEmail: before.email },
  });

  return NextResponse.json({ data: user });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// Roles that can mark forecast as failed — traders/sales/exec
const ALLOWED_ROLES = [
  "CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO",
  "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4",
] as const;

const schema = z.object({
  failedReason:   z.string().min(1),
  failedCategory: z.string().optional(),
  buyerFeedback:  z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role as never))
    return NextResponse.json({ error: "Forbidden — only traders/sales can mark failed" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const before = await prisma.forecastProject.findUnique({
    where: { id },
    select: { fcoNumber: true, fcoRecords: { select: { id: true }, take: 1 } },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.buyerFeedback && !before.fcoNumber && before.fcoRecords.length === 0)
    return NextResponse.json({ error: "Buyer feedback requires an issued FCO" }, { status: 409 });

  const project = await prisma.forecastProject.update({
    where: { id },
    data: { status: "failed", ...parsed.data },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "marked_failed", entity: "forecast_project",
    entityId: id, projectId: id,
    details: parsed.data,
  });

  return NextResponse.json({ data: project });
}

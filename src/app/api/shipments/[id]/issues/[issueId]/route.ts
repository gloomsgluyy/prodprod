import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; issueId: string }> };

const schema = z.object({
  status:      z.enum(["open","in_progress","resolved","closed"]).optional(),
  actionPlan:  z.string().optional(),
  targetDate:  z.string().optional(),
  description: z.string().optional(),
  impact:      z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, issueId } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data: Record<string, unknown> = { ...parsed.data };

  // If resolving — stamp resolved metadata
  if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
    data.resolvedAt   = new Date();
    data.resolvedById = session.user.id;
  }

  const issue = await prisma.shipmentIssue.update({ where: { id: issueId }, data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: `issue_${parsed.data.status ?? "updated"}`, entity: "shipment",
    entityId: id, shipmentId: id, details: { issueId },
  });

  return NextResponse.json({ data: issue });
}

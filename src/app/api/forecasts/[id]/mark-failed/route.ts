import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  failedReason:   z.string().min(1),
  failedCategory: z.string().optional(),
  buyerFeedback:  z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

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

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["draft", "revision"].includes(project.status))
    return NextResponse.json({ error: "Only draft or revision projects can be submitted" }, { status: 409 });

  const updated = await prisma.forecastProject.update({
    where: { id },
    data: { status: "waiting_approval" },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "submitted", entity: "forecast_project", entityId: id, projectId: id,
  });

  return NextResponse.json({ data: updated });
}

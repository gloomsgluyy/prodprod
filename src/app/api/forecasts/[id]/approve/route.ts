import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "CPPO"];

const schema = z.object({
  action:  z.enum(["approved", "rejected", "revision_requested"]),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden — only approvers can act on approvals" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status !== "waiting_approval")
    return NextResponse.json({ error: "Project is not waiting for approval" }, { status: 409 });

  const { action, comment } = parsed.data;

  const nextStatus =
    action === "approved"            ? "approved"  :
    action === "rejected"            ? "rejected"  :
    action === "revision_requested"  ? "revision"  : "waiting_approval";

  const [updated] = await prisma.$transaction([
    prisma.forecastProject.update({ where: { id }, data: { status: nextStatus as never } }),
    prisma.forecastApproval.create({
      data: {
        projectId: id,
        userId: session.user.id,
        status: action as never,
        comment,
      },
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action, entity: "forecast_project", entityId: id, projectId: id,
    details: { comment },
  });

  return NextResponse.json({ data: updated });
}

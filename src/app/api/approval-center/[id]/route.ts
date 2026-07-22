import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

const actionSchema = z.object({
  action:     z.enum(["approve", "reject", "acknowledge", "clarify"]),
  type:       z.enum(["fco", "si_early", "si_revision", "source_change", "issue_ack"]),
  reason:     z.string().optional(),
  comment:    z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { action, type, reason, comment } = parsed.data;

  // Reject requires a reason
  if (action === "reject" && !reason?.trim())
    return NextResponse.json({ error: "Reason is required when rejecting" }, { status: 422 });

  let result: Record<string, unknown> = {};

  if (type === "fco") {
    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "waiting_approval";
    const project = await prisma.forecastProject.update({
      where: { id },
      data: { status: nextStatus as never },
    });
    await prisma.forecastApproval.create({
      data: {
        projectId: id,
        userId: session.user.id,
        status: (action === "approve" ? "approved" : action === "reject" ? "rejected" : "revision_requested") as never,
        comment: comment ?? reason,
      },
    });
    await writeAuditLog({
      userId: session.user.id, userRole: session.user.role,
      action: `fco_${action}d`, entity: "forecast_project", entityId: id, projectId: id,
      details: { comment, reason },
    });
    result = { projectId: id, status: project.status };

  } else if (type === "si_early" || type === "si_revision") {
    const nextStatus = action === "approve" || action === "acknowledge" ? "approved" : action === "reject" ? "rejected" : "pending";
    await prisma.shippingInstruction.update({
      where: { id },
      data: {
        approvalStatus: nextStatus as never,
        approvedById: action !== "clarify" ? session.user.id : undefined,
        approvedAt:   action !== "clarify" ? new Date() : undefined,
      },
    });
    await writeAuditLog({
      userId: session.user.id, userRole: session.user.role,
      action: `si_${action}d`, entity: "shipping_instruction", entityId: id,
      details: { type, comment, reason },
    });
    result = { siId: id, approvalStatus: nextStatus };

  } else if (type === "source_change") {
    const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending";
    const sc = await prisma.sourceChangeLog.update({
      where: { id },
      data: {
        ceoApprovalStatus: nextStatus as never,
        ceoApprovedById: action !== "clarify" ? session.user.id : undefined,
        ceoApprovedAt:   action !== "clarify" ? new Date() : undefined,
        ceoComment:      comment ?? reason,
      },
    });
    // If approved, update the shipment's source
    if (action === "approve" && sc.shipmentId) {
      await prisma.shipment.update({
        where: { id: sc.shipmentId },
        data: { source: sc.newSource, supplier: sc.newSupplier },
      });
    }
    await writeAuditLog({
      userId: session.user.id, userRole: session.user.role,
      action: `source_change_${action}d`, entity: "source_change_log", entityId: id,
      shipmentId: sc.shipmentId ?? undefined,
      details: { comment, reason, newSource: sc.newSource },
    });
    result = { changeId: id, ceoApprovalStatus: nextStatus };

  } else if (type === "issue_ack") {
    // Acknowledge: just log it; no status change required by CEO — informational
    await writeAuditLog({
      userId: session.user.id, userRole: session.user.role,
      action: "issue_acknowledged", entity: "shipment_issue", entityId: id,
      details: { comment, acknowledgedBy: session.user.name },
    });
    result = { issueId: id, acknowledged: true };
  }

  return NextResponse.json({ data: result });
}

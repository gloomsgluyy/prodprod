export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];
const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const kind = searchParams.get("kind"); // fco | si_early | si_revision | source_change | issue_ack

  const results: {
    id: string; type: string; title: string;
    decidedBy: string; decision: string;
    decidedAt: string; comment: string | null;
  }[] = [];

  // FCO approvals (ForecastApproval table)
  if (!kind || kind === "fco") {
    const fcoDone = await prisma.forecastApproval.findMany({
      where: { status: { in: ["approved", "rejected", "revision_requested"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, status: true, comment: true, createdAt: true,
        user: { select: { name: true } },
        project: { select: { id: true, projectName: true, buyer: true } },
      },
    });
    for (const a of fcoDone) {
      results.push({
        id:         a.id,
        type:       "fco",
        title:      `${a.project?.projectName ?? ""} — ${a.project?.buyer ?? ""}`,
        decidedBy:  a.user.name,
        decision:   a.status,
        decidedAt:  a.createdAt.toISOString(),
        comment:    a.comment ?? null,
      });
    }
  }

  // SI decisions (approved/rejected ShippingInstructions)
  if (!kind || kind === "si_early" || kind === "si_revision") {
    const siDone = await prisma.shippingInstruction.findMany({
      where: { approvalStatus: { in: ["approved", "rejected"] } },
      orderBy: { approvedAt: "desc" },
      take: 50,
      select: {
        id: true, siNumber: true, version: true, isEarly: true,
        approvalStatus: true, approvedAt: true,
        approvedBy: { select: { name: true } },
        shipment: { select: { shipmentNumber: true } },
      },
    });
    for (const si of siDone) {
      const type = si.isEarly ? "si_early" : "si_revision";
      if (kind && kind !== type) continue;
      results.push({
        id:         si.id,
        type,
        title:      `${si.siNumber} v${si.version} — ${si.shipment?.shipmentNumber ?? ""}`,
        decidedBy:  si.approvedBy?.name ?? "CEO",
        decision:   si.approvalStatus,
        decidedAt:  si.approvedAt?.toISOString() ?? new Date().toISOString(),
        comment:    null,
      });
    }
  }

  // Source change decisions
  if (!kind || kind === "source_change") {
    const scDone = await prisma.sourceChangeLog.findMany({
      where: { ceoApprovalStatus: { in: ["approved", "rejected"] } },
      orderBy: { ceoApprovedAt: "desc" },
      take: 50,
      select: {
        id: true, newSource: true, ceoApprovalStatus: true, ceoApprovedAt: true, ceoComment: true,
        ceoApprovedBy: { select: { name: true } },
        shipment: { select: { shipmentNumber: true } },
      },
    });
    for (const sc of scDone) {
      results.push({
        id:         sc.id,
        type:       "source_change",
        title:      `Source Change — ${sc.shipment?.shipmentNumber ?? sc.id.slice(-8)}`,
        decidedBy:  sc.ceoApprovedBy?.name ?? "CEO",
        decision:   sc.ceoApprovalStatus,
        decidedAt:  sc.ceoApprovedAt?.toISOString() ?? new Date().toISOString(),
        comment:    sc.ceoComment ?? null,
      });
    }
  }

  // Sort all results by decidedAt desc
  results.sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());

  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return NextResponse.json({
    data: paginated,
    meta: { total: results.length, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(results.length / PAGE_SIZE) },
  });
}


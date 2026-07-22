export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ data: { total: 0 } });

  const [fco, si, sourceChange, issue] = await Promise.all([
    prisma.forecastProject.count({ where: { status: "waiting_approval" } }),
    prisma.shippingInstruction.count({ where: { approvalStatus: "pending" } }),
    prisma.sourceChangeLog.count({ where: { ceoApprovalStatus: "pending" } }),
    prisma.shipmentIssue.count({
      where: { status: { in: ["open", "in_progress"] }, category: { in: ["Quality issue", "Barge issue", "Loading delay"] } },
    }),
  ]);

  return NextResponse.json({ data: { total: fco + si + sourceChange + issue, fco, si, sourceChange, issue } });
}


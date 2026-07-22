export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";
import type { BlockerAlert } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached(
    "dashboard:blockers",
    async () => {
      const now = new Date();
      const alerts: BlockerAlert[] = [];

      // ── Payment blockers ──────────────────────────────────────────────────
      const overduePayments = await prisma.paymentRecord.findMany({
        where: { status: { in: ["pending", "partial"] }, dueDate: { lt: now } },
        select: { id: true, buyer: true, dueDate: true, shipmentId: true, shipment: { select: { shipmentNumber: true } } },
      });
      for (const p of overduePayments) {
        alerts.push({
          id: `pay-${p.id}`,
          category: "payment",
          severity: "critical",
          title: "Payment Overdue",
          message: `${p.buyer} — due ${p.dueDate?.toLocaleDateString()}`,
          owner: p.buyer,
          dueDate: p.dueDate?.toISOString() ?? null,
          shipmentId: p.shipmentId ?? null,
          shipmentNumber: p.shipment?.shipmentNumber ?? null,
          link: "/outstanding-payment",
        });
      }

      // ── Source blockers ───────────────────────────────────────────────────
      const pendingSources = await prisma.sourceChangeLog.findMany({
        where: { ceoApprovalStatus: "pending" },
        select: { id: true, shipmentId: true, newSource: true, requestDate: true, shipment: { select: { shipmentNumber: true } } },
      });
      for (const s of pendingSources) {
        alerts.push({
          id: `src-${s.id}`,
          category: "source",
          severity: "warning",
          title: "Source Change Pending Approval",
          message: `New source: ${s.newSource}`,
          owner: null,
          dueDate: null,
          shipmentId: s.shipmentId,
          shipmentNumber: s.shipment?.shipmentNumber ?? null,
          link: `/shipment-monitor?open=${s.shipmentId}&tab=source`,
        });
      }

      // ── Open issues ───────────────────────────────────────────────────────
      const openIssues = await prisma.shipmentIssue.findMany({
        where: { status: { in: ["open", "in_progress"] } },
        select: { id: true, category: true, description: true, targetDate: true, shipmentId: true, shipment: { select: { shipmentNumber: true } } },
        take: 10,
      });
      for (const i of openIssues) {
        const isOverdue = i.targetDate && new Date(i.targetDate) < now;
        alerts.push({
          id: `issue-${i.id}`,
          category: i.category === "Barge issue" ? "barge" : "closing",
          severity: isOverdue ? "critical" : "warning",
          title: `Open Issue: ${i.category}`,
          message: i.description.slice(0, 100),
          owner: null,
          dueDate: i.targetDate?.toISOString() ?? null,
          shipmentId: i.shipmentId,
          shipmentNumber: i.shipment?.shipmentNumber ?? null,
          link: `/shipment-monitor?open=${i.shipmentId}&tab=issues`,
        });
      }

      // ── Low stock ─────────────────────────────────────────────────────────
      const lowStock = await prisma.source.findMany({
        where: { isActive: true, stockAvailable: { lt: 5000 } },
        select: { id: true, name: true, stockAvailable: true },
      });
      for (const s of lowStock) {
        alerts.push({
          id: `stock-${s.id}`,
          category: "source",
          severity: Number(s.stockAvailable) < 1000 ? "critical" : "warning",
          title: "Low Stock Alert",
          message: `${s.name} — ${Number(s.stockAvailable).toLocaleString()} MT remaining`,
          owner: s.name,
          dueDate: null,
          shipmentId: null,
          shipmentNumber: null,
          link: "/sources",
        });
      }

      return alerts;
    },
    TTL.DASHBOARD_BLOCKERS,
  );

  return NextResponse.json({ data });
}


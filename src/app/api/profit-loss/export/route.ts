export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const EXPORT_ROLES = ["CEO", "DIRUT"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!EXPORT_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden — CEO/DIRUT only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const year    = searchParams.get("year");
  const segment = searchParams.get("segment"); // local | export | all

  const where = {
    status: "completed" as const,
    ...(year ? { blDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } : {}),
    ...(segment && segment !== "all" ? { type: segment as "export" | "domestic" } : {}),
  };

  const items = await prisma.shipment.findMany({
    where,
    orderBy: { blDate: "desc" },
    take: 2000,
    select: {
      id: true, shipmentNumber: true, buyer: true, buyerCountry: true,
      type: true, blDate: true,
      qtyFinal: true, qtyLoaded: true, qtyPlan: true,
      salesPrice: true, buyingPrice: true, freightRate: true,
      royaltyCost: true, taxExportCost: true, surveyCost: true, financeCost: true,
      marginMt: true,
      project: { select: { projectName: true, marginEst: true } },
    },
  });

  const header = [
    "Shipment No", "Buyer", "Country", "Type", "BL Date", "Qty (MT)",
    "Sell Price (USD/MT)", "Buy Price (USD/MT)", "Freight (USD/MT)",
    "Royalty (USD/MT)", "Export Tax (USD/MT)", "Survey (USD)", "Finance (USD/MT)",
    "Total Cost (USD/MT)", "Margin (USD/MT)", "Total Margin (USD)", "Revenue (USD)",
    "Est Margin (USD/MT)", "Deviation (USD/MT)", "Project",
  ].join(",");

  const rows = items.map((s) => {
    const qty   = Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
    const sell  = Number(s.salesPrice  ?? 0);
    const buy   = Number(s.buyingPrice ?? 0);
    const frt   = Number(s.freightRate ?? 0);
    const roy   = Number(s.royaltyCost  ?? 0);
    const tax   = Number(s.taxExportCost ?? 0);
    const srv   = Number(s.surveyCost  ?? 0);
    const fin   = Number(s.financeCost ?? 0);
    const totalCostMt = buy + frt + roy + tax + srv + fin;
    const margin = Number(s.marginMt ?? (sell - totalCostMt));
    const est    = Number(s.project?.marginEst ?? 0);
    const dev    = est > 0 ? Math.round((margin - est) * 100) / 100 : "";
    return [
      s.shipmentNumber,
      `"${s.buyer}"`,
      s.buyerCountry ?? "",
      s.type,
      s.blDate?.toISOString().split("T")[0] ?? "",
      Math.round(qty),
      sell.toFixed(4), buy.toFixed(4), frt.toFixed(4),
      roy.toFixed(4), tax.toFixed(4), srv.toFixed(2), fin.toFixed(4),
      totalCostMt.toFixed(4),
      margin.toFixed(4),
      Math.round(margin * qty),
      Math.round(sell * qty),
      est > 0 ? est.toFixed(4) : "",
      dev,
      `"${s.project?.projectName ?? ""}"`,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "pl_exported", entity: "profit_loss",
    details: { year, segment, rowCount: items.length },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pl_${year ?? "all"}_${segment ?? "all"}_${date}.csv"`,
    },
  });
}


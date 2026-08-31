import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EXEC_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!EXEC_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const projects = await prisma.forecastProject.findMany({
    where: { status: { in: ["waiting_approval", "submitted", "approved"] } },
    select: { id: true, projectName: true, buyer: true, quantity: true, laycanStart: true, status: true },
    orderBy: { updatedAt: "desc" },
  });

  // Dummy deterministic scoring until an AI provider is approved and configured.
  const data = projects.map((p, index) => ({
    projectName: p.projectName,
    summary: `Buyer: ${p.buyer}, Qty: ${p.quantity ?? "TBD"} MT, Status: ${p.status}`,
    severity: p.laycanStart && new Date(p.laycanStart) < new Date(Date.now() + 14 * 86400000) ? "HIGH" : index % 3 === 0 ? "LOW" : "MEDIUM",
    score: p.laycanStart && new Date(p.laycanStart) < new Date(Date.now() + 14 * 86400000) ? 78 : index % 3 === 0 ? 28 : 52,
  }));

  return NextResponse.json({ data });
}

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const approvals = await prisma.forecastApproval.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, comment: true, createdAt: true,
      user: { select: { name: true, role: true } },
    },
  });
  return NextResponse.json({ data: approvals });
}

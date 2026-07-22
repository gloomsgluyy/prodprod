export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 10;

  const [items, total] = await Promise.all([
    prisma.blendingSimulation.findMany({
      orderBy: { createdAt: "desc" },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
    }),
    prisma.blendingSimulation.count(),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}


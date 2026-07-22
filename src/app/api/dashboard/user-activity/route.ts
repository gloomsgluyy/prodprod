export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// CEO/DIRUT only
const ALLOWED = ["CEO", "DIRUT"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [recentLogs, userCounts] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, action: true, entity: true, createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  // Attach user names to counts
  const userIds = userCounts.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const activity = userCounts.map((u) => ({
    userId: u.userId,
    name: userMap[u.userId] ?? "Unknown",
    count: u._count.id,
  }));

  return NextResponse.json({ data: { recentLogs, activity } });
}


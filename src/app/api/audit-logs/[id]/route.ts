export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_ROLES = ["CEO","DIRUT","ASS_DIRUT"];

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: log });
}

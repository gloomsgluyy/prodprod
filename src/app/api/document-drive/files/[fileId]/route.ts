export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isExecutive } from "@/lib/roles";

type Ctx = { params: Promise<{ fileId: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { fileId } = await params;
  const session = await getServerSession(authOptions);

  const file = await prisma.documentFile.findFirst({
    where: { id: fileId, isDeleted: false },
    select: { publicUrl: true, visibility: true },
  });

  if (!file?.publicUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.visibility !== "public" && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (file.visibility === "critical" && !isExecutive(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (/^https?:\/\//i.test(file.publicUrl)) return NextResponse.json({ error: "Invalid file URL" }, { status: 502 });
  return NextResponse.redirect(new URL(file.publicUrl, process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}

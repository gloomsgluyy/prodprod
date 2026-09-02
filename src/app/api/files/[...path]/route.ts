/**
 * File proxy: serves locally-stored files from ./uploads/
 * Route: GET /api/files/[...path]
 *
 * Security rules:
 * - Files with visibility "critical" require executive session.
 * - Public (unauthenticated) users can only access visibility "public" files.
 * - objectKey is normalised to prevent path traversal.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isExecutive } from "@/lib/roles";
import { readFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import path from "path";

type Ctx = { params: Promise<{ path: string[] }> };

const MIME_MAP: Record<string, string> = {
  pdf:  "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc:  "application/msword",
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  zip:  "application/zip",
};

export async function GET(_req: Request, { params }: Ctx) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reconstruct the objectKey from path segments and sanitise
  const objectKey = segments.join("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Lookup file record in DB for visibility check
  const fileRecord = await prisma.documentFile.findFirst({
    where: { objectKey, isDeleted: false },
    select: { visibility: true },
  });

  const visibility = fileRecord?.visibility ?? "internal";

  // Critical docs require executive session
  if (visibility === "critical") {
    const session = await getServerSession(authOptions);
    if (!session || !isExecutive(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Internal docs require any session
  if (visibility === "internal") {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Read file from local storage
  const result = await readFile(objectKey);
  if (!result) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext  = path.extname(objectKey).slice(1).toLowerCase();
  const mime = MIME_MAP[ext] ?? "application/octet-stream";
  const filename = segments[segments.length - 1];

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type":        mime,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control":       "private, max-age=3600",
    },
  });
}

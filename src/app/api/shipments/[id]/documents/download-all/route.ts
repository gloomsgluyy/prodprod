/**
 * Download all shipment documents as a ZIP archive.
 * Route: GET /api/shipments/[id]/documents/download-all
 *
 * Streams a ZIP containing all non-deleted DocumentFiles for the shipment.
 * Critical files are excluded for non-executive users.
 * Files with external URLs (provider="external_url") are fetched over HTTP.
 * Files with local storage (provider="local") are read from the filesystem.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isExecutive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";
import path from "path";

// archiver is a CommonJS module; project's ESLint config does not have no-require-imports rule
type ArchiverFactory = (format: string, opts?: object) => import("archiver").Archiver;
const archiverCreate = require("archiver") as ArchiverFactory;


type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const canSeeCritical = isExecutive(session.user.role);

  // Find shipment for the ZIP filename
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: { shipmentNumber: true },
  });
  if (!shipment)
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  // Fetch all files
  const files = await prisma.documentFile.findMany({
    where: {
      isDeleted: false,
      requirement: { shipmentId: id },
      ...(!canSeeCritical ? { NOT: { visibility: "critical" } } : {}),
    },
    select: {
      id: true,
      originalName: true,
      title: true,
      provider: true,
      objectKey: true,
      publicUrl: true,
      requirement: { select: { requirementCode: true } },
    },
    orderBy: { uploadedAt: "asc" },
  });

  if (files.length === 0) {
    return NextResponse.json({ error: "No downloadable files found" }, { status: 404 });
  }

  // Build a ZIP using archiver — pipe through a Node.js stream
  const archive = archiverCreate("zip", { zlib: { level: 6 } });
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", resolve);
    archive.on("error", reject);

    (async () => {
      const nameCount: Record<string, number> = {};

      for (const file of files) {
        const rawName  = file.originalName ?? file.title ?? "document";
        const ext      = path.extname(rawName);
        const base     = path.basename(rawName, ext);
        const code     = file.requirement.requirementCode;

        // Unique name: {code}_{base}_{n}.ext
        const key = `${code}_${base}`;
        nameCount[key] = (nameCount[key] ?? 0) + 1;
        const safeName = nameCount[key] === 1
          ? `${code}_${base}${ext}`
          : `${code}_${base}_${nameCount[key]}${ext}`;

        if (file.provider === "local" && file.objectKey) {
          const result = await readFile(file.objectKey);
          if (result) {
            archive.append(result.buffer, { name: safeName });
          }
        } else if (file.publicUrl) {
          try {
            const resp = await fetch(file.publicUrl);
            if (resp.ok) {
              const buf = Buffer.from(await resp.arrayBuffer());
              archive.append(buf, { name: safeName });
            }
          } catch {
            // Skip unreachable external URLs
          }
        }
      }

      archive.finalize();
    })().catch(reject);
  });

  const zipBuffer = Buffer.concat(chunks);
  const zipName   = `docs-${shipment.shipmentNumber.replace(/\s+/g, "-")}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Content-Length":      String(zipBuffer.length),
    },
  });
}

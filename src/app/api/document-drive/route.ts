export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const source = searchParams.get("source") ?? "all";
  const group  = searchParams.get("group")  ?? "all";
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const PAGE_SIZE = 50;

  // ── Shipment documents ─────────────────────────────────────────────────────
  const shipmentDocs = await prisma.shipmentDocument.findMany({
    where: {
      fileUrl: { not: null },
      ...(search ? {
        OR: [
          { label:    { contains: search, mode: "insensitive" } },
          { owner:    { contains: search, mode: "insensitive" } },
          { fileName: { contains: search, mode: "insensitive" } },
          { shipment: { shipmentNumber: { contains: search, mode: "insensitive" } } },
          { shipment: { buyer:          { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    select: {
      id: true, requirementCode: true, label: true, status: true,
      fileUrl: true, fileName: true, fileSize: true,
      owner: true, pic: true, uploadedAt: true, uploadedBy: true, notes: true,
      shipment: { select: { id: true, shipmentNumber: true, buyer: true } },
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    orderBy: { uploadedAt: "desc" },
  });

  // ── SI documents ───────────────────────────────────────────────────────────
  const siDocs = await prisma.shippingInstruction.findMany({
    where: {
      pdfUrl: { not: null },
      ...(search ? {
        OR: [
          { siNumber:  { contains: search, mode: "insensitive" } },
          { buyer:     { contains: search, mode: "insensitive" } },
          { supplier:  { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true, siNumber: true, version: true, pdfUrl: true,
      buyer: true, supplier: true, pol: true, pod: true,
      approvalStatus: true, createdAt: true,
      shipment: { select: { shipmentNumber: true } },
    },
    take: 50,
  });

  // ── FCO documents ──────────────────────────────────────────────────────────
  const fcoDocs = await prisma.fCORecord.findMany({
    where: {
      pdfUrl: { not: null },
      ...(search ? {
        OR: [
          { fcoNumber: { contains: search, mode: "insensitive" } },
          { project:   { projectName: { contains: search, mode: "insensitive" } } },
          { project:   { buyer:       { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    select: {
      id: true, fcoNumber: true, version: true, pdfUrl: true,
      action: true, generatedAt: true,
      project: { select: { projectName: true, buyer: true } },
    },
    take: 50,
  });

  // ── Normalise into unified document format ─────────────────────────────────
  type DocEntry = {
    id: string; name: string; fileName: string | null; fileSize: number | null;
    fileUrl: string; group: string; source: string;
    owner: string | null; buyer: string | null; shipmentNumber: string | null;
    uploadedAt: string | null; isCritical: boolean; notes: string | null;
  };

  const MANDATORY_CODES = ["b","g","i","j","k"]; // per closing checklist

  const docs: DocEntry[] = [
    ...shipmentDocs.map((d) => ({
      id:       d.id,
      name:     d.label,
      fileName: d.fileName,
      fileSize: d.fileSize,
      fileUrl:  d.fileUrl!,
      group:    "Shipment Document",
      source:   "Shipment",
      owner:    d.owner ?? d.pic,
      buyer:    d.shipment?.buyer ?? null,
      shipmentNumber: d.shipment?.shipmentNumber ?? null,
      uploadedAt: d.uploadedAt?.toISOString() ?? null,
      isCritical: MANDATORY_CODES.includes(d.requirementCode),
      notes:    d.notes,
    })),
    ...siDocs.map((si) => ({
      id:       si.id,
      name:     `SI ${si.siNumber} v${si.version}`,
      fileName: `${si.siNumber}_v${si.version}.pdf`,
      fileSize: null,
      fileUrl:  si.pdfUrl!,
      group:    "SI",
      source:   "SI",
      owner:    si.supplier,
      buyer:    si.buyer,
      shipmentNumber: si.shipment?.shipmentNumber ?? null,
      uploadedAt: si.createdAt.toISOString(),
      isCritical: false,
      notes:    null,
    })),
    ...fcoDocs.map((fco) => ({
      id:       fco.id,
      name:     `FCO ${fco.fcoNumber} v${fco.version}`,
      fileName: `${fco.fcoNumber}_v${fco.version}.pdf`,
      fileSize: null,
      fileUrl:  fco.pdfUrl!,
      group:    "Forecast",
      source:   "Forecast",
      owner:    null,
      buyer:    fco.project?.buyer ?? null,
      shipmentNumber: null,
      uploadedAt: fco.generatedAt.toISOString(),
      isCritical: false,
      notes:    null,
    })),
  ];

  // Apply source/group filter
  const filtered = docs.filter((d) => {
    if (source !== "all" && d.source.toLowerCase() !== source.toLowerCase()) return false;
    if (group  !== "all" && d.group.toLowerCase()  !== group.toLowerCase())  return false;
    return true;
  });

  // Summary counts
  const summary = {
    total:    docs.length,
    shipment: docs.filter((d) => d.source === "Shipment").length,
    si:       docs.filter((d) => d.source === "SI").length,
    forecast: docs.filter((d) => d.source === "Forecast").length,
    required: docs.filter((d) => d.isCritical).length,
  };

  return NextResponse.json({
    data: filtered,
    meta: { total: filtered.length },
    summary,
  });
}


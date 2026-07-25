export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isExecutive } from "@/lib/roles";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const canSeeCritical = !!session?.user?.role && isExecutive(session.user.role);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const source = searchParams.get("source") ?? "all";
  const group = searchParams.get("group") ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const PAGE_SIZE = 50;

  const shipmentDocs = await prisma.documentFile.findMany({
    where: {
      isDeleted: false,
      publicUrl: { not: null },
      ...(canSeeCritical ? {} : { visibility: { not: "critical" } }),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { originalName: { contains: search, mode: "insensitive" } },
          { requirement: { label: { contains: search, mode: "insensitive" } } },
          { requirement: { owner: { contains: search, mode: "insensitive" } } },
          { requirement: { shipment: { shipmentNumber: { contains: search, mode: "insensitive" } } } },
          { requirement: { shipment: { buyer: { contains: search, mode: "insensitive" } } } },
        ],
      } : {}),
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      size: true,
      publicUrl: true,
      visibility: true,
      uploadedAt: true,
      requirement: {
        select: {
          requirementCode: true,
          label: true,
          owner: true,
          pic: true,
          notes: true,
          shipment: { select: { id: true, shipmentNumber: true, buyer: true } },
        },
      },
    },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    orderBy: { uploadedAt: "desc" },
  });

  // Generated SI/FCO/Summary from GeneratedDocument table — SRS CP-04
  const generatedDocs = await prisma.generatedDocument.findMany({
    where: {
      ...(canSeeCritical ? {} : { visibility: { not: "critical" } }),
      ...(search ? {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true, type: true, number: true, version: true,
      title: true, pdfUrl: true, visibility: true, generatedAt: true,
      shipmentId: true, forecastProjectId: true,
    },
    take: 50,
    orderBy: { generatedAt: "desc" },
  });

  const siDocs = await prisma.shippingInstruction.findMany({
    where: {
      pdfUrl: { not: null },
      ...(search ? {
        OR: [
          { siNumber: { contains: search, mode: "insensitive" } },
          { buyer: { contains: search, mode: "insensitive" } },
          { supplier: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true,
      siNumber: true,
      version: true,
      pdfUrl: true,
      buyer: true,
      supplier: true,
      approvalStatus: true,
      createdAt: true,
      shipment: { select: { shipmentNumber: true } },
    },
    take: 50,
  });

  const fcoDocs = await prisma.fCORecord.findMany({
    where: {
      pdfUrl: { not: null },
      ...(search ? {
        OR: [
          { fcoNumber: { contains: search, mode: "insensitive" } },
          { project: { projectName: { contains: search, mode: "insensitive" } } },
          { project: { buyer: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    select: {
      id: true,
      fcoNumber: true,
      version: true,
      pdfUrl: true,
      action: true,
      generatedAt: true,
      project: { select: { projectName: true, buyer: true } },
    },
    take: 50,
  });

  type DocEntry = {
    id: string;
    name: string;
    fileName: string | null;
    fileSize: number | null;
    fileUrl: string;
    group: string;
    source: string;
    owner: string | null;
    buyer: string | null;
    shipmentNumber: string | null;
    uploadedAt: string | null;
    isCritical: boolean;
    notes: string | null;
  };

  const docs: DocEntry[] = [
    ...generatedDocs.map((g) => ({
      id: g.id,
      name: g.title,
      fileName: g.pdfUrl ? `${g.number}_v${g.version}.pdf` : null,
      fileSize: null,
      fileUrl: g.pdfUrl ?? "",
      group: g.type === "si" ? "SI" : g.type === "fco" ? "Forecast" : "Summary",
      source: g.type === "si" ? "SI" : g.type === "fco" ? "Forecast" : "Summary",
      owner: null,
      buyer: null,
      shipmentNumber: g.shipmentId ?? null,
      uploadedAt: g.generatedAt.toISOString(),
      isCritical: g.visibility === "critical",
      notes: null,
    })).filter((g) => g.fileUrl),  // only list if PDF persisted
    ...shipmentDocs.map((d) => ({
      id: d.id,
      name: d.title ?? d.requirement.label,
      fileName: d.originalName,
      fileSize: d.size,
      fileUrl: `/api/document-drive/files/${d.id}`,
      group: "Shipment Document",
      source: "Shipment",
      owner: d.requirement.owner ?? d.requirement.pic,
      buyer: d.requirement.shipment?.buyer ?? null,
      shipmentNumber: d.requirement.shipment?.shipmentNumber ?? null,
      uploadedAt: d.uploadedAt?.toISOString() ?? null,
      isCritical: d.visibility === "critical",
      notes: d.requirement.notes,
    })),
    ...siDocs.map((si) => ({
      id: si.id,
      name: `SI ${si.siNumber} v${si.version}`,
      fileName: `${si.siNumber}_v${si.version}.pdf`,
      fileSize: null,
      fileUrl: si.pdfUrl!,
      group: "SI",
      source: "SI",
      owner: si.supplier,
      buyer: si.buyer,
      shipmentNumber: si.shipment?.shipmentNumber ?? null,
      uploadedAt: si.createdAt.toISOString(),
      isCritical: false,
      notes: null,
    })),
    ...fcoDocs.map((fco) => ({
      id: fco.id,
      name: `FCO ${fco.fcoNumber} v${fco.version}`,
      fileName: `${fco.fcoNumber}_v${fco.version}.pdf`,
      fileSize: null,
      fileUrl: fco.pdfUrl!,
      group: "Forecast",
      source: "Forecast",
      owner: null,
      buyer: fco.project?.buyer ?? null,
      shipmentNumber: null,
      uploadedAt: fco.generatedAt.toISOString(),
      isCritical: false,
      notes: null,
    })),
  ];

  const filtered = docs.filter((d) => {
    if (source !== "all" && d.source.toLowerCase() !== source.toLowerCase()) return false;
    if (group !== "all" && d.group.toLowerCase() !== group.toLowerCase()) return false;
    return true;
  });

  const summary = {
    total: docs.length,
    shipment: docs.filter((d) => d.source === "Shipment").length,
    si: docs.filter((d) => d.source === "SI").length,
    forecast: docs.filter((d) => d.source === "Forecast").length,
    required: docs.filter((d) => d.group === "Shipment Document").length,
  };

  return NextResponse.json({
    data: filtered,
    meta: { total: filtered.length },
    summary,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const { id: forecastId, candidateId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Verify candidate exists and belongs to forecast
    const existing = await prisma.forecastSupplierCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!existing || existing.forecastProjectId !== forecastId) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const candidate = await prisma.forecastSupplierCandidate.update({
      where: { id: candidateId },
      data: {
        sourceId: body.sourceId !== undefined ? body.sourceId || null : undefined,
        supplierName: body.supplierName,
        origin: body.origin !== undefined ? body.origin || null : undefined,
        stockMt: body.stockMt !== undefined ? body.stockMt || null : undefined,
        priceUsd: body.priceUsd !== undefined ? body.priceUsd || null : undefined,
        readinessStatus: body.readinessStatus !== undefined ? body.readinessStatus || null : undefined,
        legalStatus: body.legalStatus !== undefined ? body.legalStatus || null : undefined,
        gar: body.gar !== undefined ? body.gar || null : undefined,
        nar: body.nar !== undefined ? body.nar || null : undefined,
        tm: body.tm !== undefined ? body.tm || null : undefined,
        im: body.im !== undefined ? body.im || null : undefined,
        ts: body.ts !== undefined ? body.ts || null : undefined,
        ash: body.ash !== undefined ? body.ash || null : undefined,
        vm: body.vm !== undefined ? body.vm || null : undefined,
        hgi: body.hgi !== undefined ? body.hgi || null : undefined,
        size: body.size !== undefined ? body.size || null : undefined,
        fitScore: body.fitScore !== undefined ? body.fitScore || null : undefined,
        belowSpecFlags: body.belowSpecFlags !== undefined ? body.belowSpecFlags || null : undefined,
        belowSpecAcknowledged: body.belowSpecAcknowledged !== undefined ? body.belowSpecAcknowledged : undefined,
        belowSpecReason: body.belowSpecReason !== undefined ? body.belowSpecReason || null : undefined,
        selected: body.selected !== undefined ? body.selected : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    });

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error("Failed to update supplier candidate:", error);
    return NextResponse.json(
      { error: "Failed to update supplier candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const { id: forecastId, candidateId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify candidate exists and belongs to forecast
    const existing = await prisma.forecastSupplierCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!existing || existing.forecastProjectId !== forecastId) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.forecastSupplierCandidate.delete({
      where: { id: candidateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete supplier candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier candidate" },
      { status: 500 }
    );
  }
}

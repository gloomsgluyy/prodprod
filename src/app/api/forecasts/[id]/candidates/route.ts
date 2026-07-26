import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: forecastId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidates = await prisma.forecastSupplierCandidate.findMany({
      where: { forecastProjectId: forecastId },
      orderBy: [{ fitScore: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ data: candidates });
  } catch (error) {
    console.error("Failed to fetch supplier candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier candidates" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: forecastId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Verify forecast exists
    const forecast = await prisma.forecastProject.findUnique({
      where: { id: forecastId },
    });

    if (!forecast) {
      return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
    }

    const candidate = await prisma.forecastSupplierCandidate.create({
      data: {
        forecastProjectId: forecastId,
        sourceId: body.sourceId || null,
        supplierName: body.supplierName,
        origin: body.origin || null,
        stockMt: body.stockMt || null,
        priceUsd: body.priceUsd || null,
        readinessStatus: body.readinessStatus || null,
        legalStatus: body.legalStatus || null,
        gar: body.gar || null,
        nar: body.nar || null,
        tm: body.tm || null,
        im: body.im || null,
        ts: body.ts || null,
        ash: body.ash || null,
        vm: body.vm || null,
        hgi: body.hgi || null,
        size: body.size || null,
        fitScore: body.fitScore || null,
        belowSpecFlags: body.belowSpecFlags || null,
        belowSpecAcknowledged: body.belowSpecAcknowledged ?? false,
        belowSpecReason: body.belowSpecReason || null,
        selected: body.selected ?? false,
        notes: body.notes || null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error("Failed to create supplier candidate:", error);
    return NextResponse.json(
      { error: "Failed to create supplier candidate" },
      { status: 500 }
    );
  }
}

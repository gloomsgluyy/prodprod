export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/blending/prefill?dealId=xxx
 * GET /api/blending/prefill?projectId=xxx
 * GET /api/blending/prefill?qualityId=xxx
 *
 * Returns target spec pre-fill data for the Blending Simulator deep-link (FR-BLD-008, FR-BLD-009).
 * Client opens /blending?dealId=xxx → calls this endpoint → pre-fills target spec inputs.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dealId      = searchParams.get("dealId");
  const projectId   = searchParams.get("projectId");
  const qualityId   = searchParams.get("qualityId");

  if (!dealId && !projectId && !qualityId)
    return NextResponse.json({ error: "Provide dealId, projectId, or qualityId" }, { status: 400 });

  // ── From Sales Monitor deal ────────────────────────────────────────────────
  if (dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, projectName: true, buyer: true, specGar: true, specTs: true, specAsh: true, specTm: true, pricePerMt: true },
    });
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        source:          "deal",
        sourceId:        deal.id,
        contextLabel:    `${deal.projectName} — ${deal.buyer}`,
        targetSpec: {
          minGar:          deal.specGar ? Number(deal.specGar) : null,
          maxTs:           deal.specTs  ? Number(deal.specTs)  : null,
          maxAsh:          deal.specAsh ? Number(deal.specAsh) : null,
          maxTm:           deal.specTm  ? Number(deal.specTm)  : null,
          targetSellPrice: deal.pricePerMt ? Number(deal.pricePerMt) : null,
        },
      },
    });
  }

  // ── From Forecast Sales project ────────────────────────────────────────────
  if (projectId) {
    const project = await prisma.forecastProject.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, buyer: true, specGar: true, specTs: true, specAsh: true, specTm: true, salesPriceEst: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        source:          "project",
        sourceId:        project.id,
        contextLabel:    `${project.projectName} — ${project.buyer}`,
        targetSpec: {
          minGar:          project.specGar ? Number(project.specGar) : null,
          maxTs:           project.specTs  ? Number(project.specTs)  : null,
          maxAsh:          project.specAsh ? Number(project.specAsh) : null,
          maxTm:           project.specTm  ? Number(project.specTm)  : null,
          targetSellPrice: project.salesPriceEst ? Number(project.salesPriceEst) : null,
        },
      },
    });
  }

  // ── From Quality record (warning/need_review/claim_potential only) ─────────
  if (qualityId) {
    const qr = await prisma.qualityResult.findUnique({
      where: { id: qualityId },
      select: { id: true, cargoName: true, status: true, contractSpec: true },
    });
    if (!qr) return NextResponse.json({ error: "Quality result not found" }, { status: 404 });

    const ALLOWED_STATUSES = ["warning", "need_review", "claim_potential"];
    if (!ALLOWED_STATUSES.includes(qr.status)) {
      return NextResponse.json({
        error: `"Check Blend Option" only available for warning/need_review/claim_potential status (current: ${qr.status})`,
      }, { status: 409 });
    }

    const spec = (qr.contractSpec ?? {}) as Record<string, number | null>;
    return NextResponse.json({
      data: {
        source:          "quality",
        sourceId:        qr.id,
        contextLabel:    `${qr.cargoName} — Contract Spec: GAR ${spec.gar ?? "—"}, TS ${spec.ts ?? "—"}%`,
        targetSpec: {
          minGar: spec.gar  ? Number(spec.gar)  : null,
          maxTs:  spec.ts   ? Number(spec.ts)   : null,
          maxAsh: spec.ash  ? Number(spec.ash)  : null,
          maxTm:  spec.tm   ? Number(spec.tm)   : null,
          targetSellPrice: null,
        },
      },
    });
  }
}


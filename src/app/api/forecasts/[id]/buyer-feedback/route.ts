import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const BUYER_FEEDBACK_STATUS = ["fco_sent", "waiting_feedback", "negotiation", "deal", "failed"] as const;

const schema = z.object({
  status: z.enum(BUYER_FEEDBACK_STATUS),
  reason: z.string().optional(),
});

const ALLOWED_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4", "JUNIOR_TRADER"];
const NEXT_STATES: Record<string, string[]> = {
  fco_sent: ["approved", "deal"], waiting_feedback: ["approved", "deal"],
  negotiation: ["approved", "deal"], deal: ["approved", "deal"], failed: ["approved", "deal"],
};

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!NEXT_STATES[parsed.data.status]?.includes(project.status))
    return NextResponse.json({ error: `Buyer feedback cannot be set from forecast status '${project.status}'` }, { status: 409 });

  // Gate: FCO must exist before updating buyer feedback (except fco_sent)
  if (!project.fcoNumber && parsed.data.status !== "fco_sent")
    return NextResponse.json({ error: "Generate FCO first before updating buyer feedback" }, { status: 409 });

  // Gate: Reason required for failed
  if (parsed.data.status === "failed" && !parsed.data.reason?.trim())
    return NextResponse.json({ error: "Reason required when marking as failed" }, { status: 422 });

  const now = new Date();
  const historyEntry = {
    status: parsed.data.status,
    reason: parsed.data.reason ?? null,
    timestamp: now.toISOString(),
    userId: session.user.id,
    userName: session.user.name,
  };
  const history = (project.buyerFeedbackHistory as unknown[] ?? []) as typeof historyEntry[];
  history.push(historyEntry);

  const updated = await prisma.forecastProject.update({
    where: { id },
    data: {
      buyerFeedbackStatus: parsed.data.status,
      ...(parsed.data.status === "deal" ? { status: "deal" } : {}),
      buyerFeedbackReason: parsed.data.reason ?? null,
      buyerFeedbackUpdatedAt: now,
      buyerFeedbackHistory: history as never,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "buyer_feedback_updated", entity: "forecast_project",
    entityId: id, projectId: id,
    details: { status: parsed.data.status, reason: parsed.data.reason },
  });

  return NextResponse.json({ data: updated });
}

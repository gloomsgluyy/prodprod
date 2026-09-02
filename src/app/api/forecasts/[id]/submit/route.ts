import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

// Roles that can submit forecast for approval — traders, sales, ops
const SUBMITTER_ROLES = [
  "CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO",
  "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4", "JUNIOR_TRADER",
] as const;

// Mandatory fields that must be non-null/non-empty before submit — SRS E2E-02
const MANDATORY_FIELDS: { key: string; label: string }[] = [
  { key: "projectName",   label: "Offer / Project Name" },
  { key: "buyer",         label: "Buyer Name" },
  { key: "buyerCountry",  label: "Buyer Country" },
  { key: "quantity",      label: "Quantity" },
  { key: "laycanStart",   label: "Laycan Start" },
  { key: "laycanEnd",     label: "Laycan End" },
  { key: "pol",           label: "Port of Loading" },
  { key: "shippingTerm",  label: "Sales Term" },
  { key: "salesPriceEst", label: "Target Selling Price" },
  { key: "specGar",       label: "GAR / Main Coal Spec" },
  { key: "forecastMonth",  label: "1. Forecast Month" },
  { key: "commodity",      label: "Commodity" },
  { key: "priceBasis",     label: "5. Price Basis" },
  { key: "paymentTerm",    label: "8. Payment Term" },
  { key: "surveyor",       label: "Surveyor" },
];

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SUBMITTER_ROLES.includes(session.user.role as never))
    return NextResponse.json({ error: "Forbidden — only traders/sales can submit forecasts" }, { status: 403 });

  const { id } = await params;
  const project = await prisma.forecastProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["draft", "revision"].includes(project.status))
    return NextResponse.json({ error: "Only draft or revision projects can be submitted" }, { status: 409 });

  // Mandatory field validation
  const missing = MANDATORY_FIELDS.filter(({ key }) => {
    const val = (project as Record<string, unknown>)[key];
    return val == null || val === "" || val === 0;
  });

  if (missing.length > 0) {
    return NextResponse.json({
      error: "Cannot submit: mandatory fields are missing",
      missing: missing.map((field) => ({ key: field.key, label: field.label })),
    }, { status: 422 });
  }

  // Check selected supplier below spec acknowledgement parity
  const selectedCandidate = await prisma.forecastSupplierCandidate.findFirst({
    where: { forecastProjectId: id, selected: true },
  });

  if (selectedCandidate) {
    const isBelowSpec = (selectedCandidate.fitScore != null && Number(selectedCandidate.fitScore) < 80) ||
      (selectedCandidate.belowSpecFlags && Object.keys(selectedCandidate.belowSpecFlags as object).length > 0);

    if (isBelowSpec && (!selectedCandidate.belowSpecAcknowledged || !selectedCandidate.belowSpecReason?.trim())) {
      return NextResponse.json({
        error: `Cannot submit: Selected supplier "${selectedCandidate.supplierName}" is below spec and requires an acknowledgement reason.`,
      }, { status: 422 });
    }
  }

  const updated = await prisma.forecastProject.update({
    where: { id },
    data: { status: "waiting_approval" },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "submitted", entity: "forecast_project", entityId: id, projectId: id,
    details: { validatedFields: MANDATORY_FIELDS.map((f) => f.key) },
  });

  return NextResponse.json({ data: updated });
}

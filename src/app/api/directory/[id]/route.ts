export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { canMutatePartner } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

// Expanded type enum to match SRS_14 FR-DIR-003 (9 types)
const PARTNER_TYPES = ["buyer","supplier","vendor","surveyor","freight","lab","agent","barge_owner","bank","internal_pic"] as const;

const legalDocSchema = z.object({
  id:          z.string().optional(),
  name:        z.string().min(1),
  type:        z.string().optional(),
  issuedDate:  z.string().optional(),
  expiryDate:  z.string().optional(),
  fileUrl:     z.string().url().optional(),
  status:      z.enum(["valid","expiring_soon","expired","pending"]).optional(),
});

const updateSchema = z.object({
  name:          z.string().min(1).optional(),
  type:          z.enum(PARTNER_TYPES).optional(),
  country:       z.string().optional(),
  address:       z.string().optional(),
  contactName:   z.string().optional(),
  contactEmail:  z.string().email().optional().or(z.literal("")),
  contactPhone:  z.string().optional(),
  npwp:          z.string().optional(),
  bankAccount:   z.string().optional(),
  fleetSize:     z.coerce.number().int().min(0).optional(),
  registrationNumber: z.string().optional(),
  swiftCode:     z.string().optional(),
  legalDocuments:z.array(legalDocSchema).optional(),
  aiDueDiligence:z.record(z.unknown()).optional(),
  isActive:      z.boolean().optional(),
  notes:         z.string().optional(),
}).partial();

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: partner });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutatePartner(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const partner = await prisma.partner.update({ where: { id }, data: parsed.data as never });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "partner", entityId: id,
    details: { updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data: partner });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutatePartner(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.partner.update({ where: { id }, data: { isActive: false } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "deactivated", entity: "partner", entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}

export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const type   = searchParams.get("type");
  const search = searchParams.get("search") ?? "";

  const where = {
    isActive: true,
    ...(type && type !== "all" ? { type } : {}),
    ...(search ? {
      OR: [
        { name:        { contains: search, mode: "insensitive" as const } },
        { contactName: { contains: search, mode: "insensitive" as const } },
        { country:     { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.partner.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  name:         z.string().min(1, "Required"),
  type:         z.enum(["buyer","supplier","vendor","surveyor","freight","lab","agent","barge_owner","bank","internal_pic"]),
  country:      z.string().optional(),
  address:      z.string().optional(),
  contactName:  z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  notes:        z.string().optional(),
  isActive:     z.boolean().default(true),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Duplicate check per BR-DIR-002
  const existing = await prisma.partner.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" }, type: parsed.data.type },
  });
  
  if (existing) {
    if (existing.isActive) {
      return NextResponse.json({
        error: `Partner "${parsed.data.name}" of type ${parsed.data.type} already exists`,
      }, { status: 409 });
    } else {
      // Resurrect inactive partner
      const partner = await prisma.partner.update({
        where: { id: existing.id },
        data: { ...parsed.data, isActive: true },
      });
      await writeAuditLog({
        userId: session.user.id, userRole: session.user.role,
        action: "created", entity: "partner", entityId: partner.id,
        details: { name: partner.name, type: partner.type, resurrected: true },
      });
      return NextResponse.json({ data: partner }, { status: 201 });
    }
  }

  const partner = await prisma.partner.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "created", entity: "partner", entityId: partner.id,
    details: { name: partner.name, type: partner.type },
  });

  return NextResponse.json({ data: partner }, { status: 201 });
}


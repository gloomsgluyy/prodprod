export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { writeAuditLog } from "@/lib/audit";

const PAGE_SIZE = 50;
const ALLOWED_CALLER_ROLES = ["CEO","DIRUT"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_CALLER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? "";

  const where = search ? {
    OR: [
      { name:  { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ],
  } : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
  role:     z.enum([
    "CEO","DIRUT","ASS_DIRUT","COO","CMO","CPPO",
    "TRADERS_1","TRADERS_2","TRADERS_3","TRADERS_4","JUNIOR_TRADER",
    "ADMIN_MARKETING","TRAFFIC_HEAD","TRAFFIC_1","TRAFFIC_2","TRAFFIC_3","TRAFFIC_4",
    "ADMIN_OPERATION","SPV_SOURCING","SOURCING_1","SOURCING_2","SOURCING_3","SOURCING_4",
    "QQ_MANAGER","QC_MANAGER","QC_ADMIN_1","QC_ADMIN_2","FINANCE","STAFF",
  ]).default("STAFF"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_CALLER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing)
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  const user   = await prisma.user.create({
    data: { ...parsed.data, email: parsed.data.email.toLowerCase(), password: hashed },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "user_created", entity: "user", entityId: user.id,
    details: { email: user.email, role: user.role },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}


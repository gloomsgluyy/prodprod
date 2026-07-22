export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const upcoming = searchParams.get("upcoming") === "true";

  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
    ...(search ? {
      OR: [
        { title:    { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, title: true, scheduledAt: true, location: true,
        participants: true, status: true, agenda: true,
        momContent: true, momPdfUrl: true, audioUrl: true,
        taskExtractionStatus: true, createdAt: true,
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

const createSchema = z.object({
  title:             z.string().min(1,"Required"),
  scheduledAt:       z.string().min(1,"Required"),
  location:          z.string().optional(),
  participants:      z.array(z.string()).min(1,"At least one participant required"),
  agenda:            z.string().optional(),
  status:            z.enum(["scheduled","in_progress","completed"]).default("scheduled"),
  linkedShipmentId:  z.string().uuid().optional().nullable(),
  linkedProjectId:   z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const meeting = await prisma.meeting.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  return NextResponse.json({ data: meeting }, { status: 201 });
}


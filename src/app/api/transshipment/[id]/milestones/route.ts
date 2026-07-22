import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  milestones: z.array(z.object({
    title:    z.string().min(1),
    subtitle: z.string().optional(),
    status:   z.enum(["pending","current","completed"]),
  })).min(1),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.update({
    where: { id },
    data:  { milestones: parsed.data.milestones },
  });

  return NextResponse.json({ data: record });
}

export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const PAGE_SIZE = 50;
const EXPORT_LIMIT = 2000;
const ALLOWED_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];
const EXPORT_ROLES  = ["CEO", "DIRUT"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const isExport  = searchParams.get("export") === "csv";
  const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
  const action    = searchParams.get("action");
  const entity    = searchParams.get("entity");
  const search    = searchParams.get("search") ?? "";
  const dateFrom  = searchParams.get("dateFrom");
  const dateTo    = searchParams.get("dateTo");

  if (isExport && !EXPORT_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden — only CEO/DIRUT can export" }, { status: 403 });

  const where = {
    ...(action && action !== "all" ? { action } : {}),
    ...(entity && entity !== "all" ? { entity } : {}),
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) } : {}),
      },
    } : {}),
    ...(search ? {
      OR: [
        { action:   { contains: search, mode: "insensitive" as const } },
        { entity:   { contains: search, mode: "insensitive" as const } },
        { entityId: { contains: search, mode: "insensitive" as const } },
        { user:     { name: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  if (isExport) {
    const items = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      select: {
        id: true, action: true, entity: true, entityId: true,
        userRole: true, details: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Build CSV
    const header = ["ID", "Timestamp", "User Name", "User Email", "User Role", "Action", "Entity", "Entity ID", "Details"].join(",");
    const rows = items.map((i) => [
      i.id,
      i.createdAt.toISOString(),
      `"${(i.user?.name ?? "").replace(/"/g, '""')}"`,
      `"${(i.user?.email ?? "").replace(/"/g, '""')}"`,
      i.userRole,
      i.action,
      i.entity,
      i.entityId ?? "",
      `"${JSON.stringify(i.details ?? {}).replace(/"/g, '""')}"`,
    ].join(","));

    const csv = [header, ...rows].join("\n");
    const date = new Date().toISOString().split("T")[0];

    // Meta-audit: log that an export was performed
    await writeAuditLog({
      userId: session.user.id, userRole: session.user.role,
      action: "audit_log_exported", entity: "audit_log",
      details: { rowCount: items.length, filters: { action, entity, dateFrom, dateTo, search } },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit_logs_${date}.csv"`,
      },
    });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, action: true, entity: true, entityId: true,
        userRole: true, details: true, createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}


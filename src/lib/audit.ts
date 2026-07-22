import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface AuditParams {
  userId:    string;
  userRole:  string;
  action:    string;
  entity:    string;
  entityId?: string;
  details?:  Record<string, unknown>;
  shipmentId?: string;
  projectId?:  string;
}

// Non-throwing — audit failure should never block the main operation
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    const { details, ...rest } = params;
    await prisma.auditLog.create({
      data: {
        ...rest,
        // Cast details to Prisma's Json type — Record<string,unknown> is structurally
        // compatible but Prisma's InputJsonValue type needs this explicit cast
        ...(details !== undefined ? { details: details as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}

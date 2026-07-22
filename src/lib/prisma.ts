import { PrismaClient, Prisma } from "@prisma/client";

// ── Decimal → number extension ────────────────────────────────────────────────
// Prisma returns Decimal fields as Decimal objects that lack standard JS number
// methods (e.g. .toFixed). This extension converts every Decimal value to a
// plain JS number transparently on every query result, so no per-route casting
// is needed.

function convertDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Prisma.Decimal) return Number(obj);
  if (Object.prototype.toString.call(obj) === "[object Date]") return obj;
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = convertDecimals(v);
    }
    return out;
  }
  return obj;
}

// Prevent multiple instances in Next.js hot-reload dev environment
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const baseClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

const DATE_FIELDS = new Set([
  "createdAt", "updatedAt", "date", "laycanStart", "laycanEnd", "fcoSentDate", 
  "blDate", "etd", "eta", "receivedDate", "submittedDate", "uploadedAt", 
  "requestDate", "ceoApprovedAt", "changeDatetime", "targetDate", "resolvedAt", 
  "approvedAt", "arrivePol", "norPol", "berthing", "commenceLoading", 
  "completeLoading", "etaPod", "arrivePod", "norPod", "inPosition", 
  "dischargeStart", "dischargeComplete", "factoryDate", "samplingDate", 
  "iupExpiryDate", "cobUpdatedAt", "reportedDate", "resolvedDate", 
  "calculationDate", "dpToShipmentDate", "dueDate", "invoiceDate", 
  "scheduledAt", "generatedAt", "sentDate", "confirmationDate", 
  "validityStart", "validityEnd", "issuedDate"
]);

function parseDateStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(parseDateStrings);
  if (typeof obj === "object") {
    // If it's a special class instance (like Date, Buffer, Decimal), return it intact
    if (obj.constructor !== Object) return obj;
    
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && DATE_FIELDS.has(k)) {
        if (v === "") out[k] = null;
        else {
          const parsed = new Date(v);
          out[k] = isNaN(parsed.getTime()) ? v : parsed;
        }
      } else {
        out[k] = parseDateStrings(v);
      }
    }
    return out;
  }
  return obj;
}

// Apply the Decimal → number result transformer globally
export const prisma = baseClient.$extends({
  result: {
    $allModels: {
      // This is a no-op marker — actual conversion happens in query middleware below
    },
  },
  query: {
    $allModels: {
      $allOperations: async ({ args, query }) => {
        const a = args as Record<string, any>;
        if (a && typeof a === "object") {
          if (a.data) a.data = parseDateStrings(a.data);
          if (a.where) a.where = parseDateStrings(a.where);
        }
        const result = await query(args);
        return convertDecimals(result);
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

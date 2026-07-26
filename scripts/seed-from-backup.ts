/**
 * seed-from-backup.ts
 * Imports CoalOS v1 JSON backup → v2 Prisma schema
 * Run: npx tsx scripts/seed-from-backup.ts
 *
 * Dependency order:
 *   User → Source → Partner → MarketPrice → ForecastProject
 *   → Shipment → ShipmentDocument → QualityResult
 *   → DailyDeliveryLog → Task → Meeting
 *   → BlendingSimulation → AuditLog
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const BACKUP = path.join(__dirname, "../CoalOS_DB_Backup_2026-07-10T14-10-17");

function read<T>(file: string): T[] {
  try {
    const raw = fs.readFileSync(path.join(BACKUP, file), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`  ⚠ Could not read ${file}`);
    return [];
  }
}

function safeDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? undefined : d;
}

function safeDecimal(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
}

// ── User ID fallback (if createdBy ref doesn't exist in backup) ────────────
let FALLBACK_USER_ID = "";

async function seedUsers() {
  console.log("→ Users");
  const rows = read<Record<string, unknown>>("User.json");
  let count = 0;
  // Map v1 roles that don't exist in v2 enum
  const roleMap: Record<string, string> = {
    TRADERS_2_CPPO:    "CPPO",
    TRADERS_3_COO:     "COO",
    TRADERS_4_CMO:     "CMO",
    ADMIN_TRAFFIC:     "TRAFFIC_1",
    ADMIN_SOURCING:    "SOURCING_1",
    ADMIN_QUALITY:     "QC_ADMIN_1",
    SPV_TRAFFIC:       "TRAFFIC_HEAD",
    SOURCING_OFFICER_1:"SOURCING_1",
    SOURCING_OFFICER_2:"SOURCING_2",
    SOURCING_OFFICER_3:"SOURCING_3",
    SOURCING_OFFICER_4:"SOURCING_4",
    TRAFFIC_TEAM_1:    "TRAFFIC_1",
    TRAFFIC_TEAM_2:    "TRAFFIC_2",
    TRAFFIC_TEAM_3:    "TRAFFIC_3",
    TRAFFIC_TEAM_4:    "TRAFFIC_4",
  };
  for (const u of rows) {
    if (!u.id || !u.email) continue;
    const rawRole = u.role as string;
    const role = roleMap[rawRole] ?? rawRole;
    await prisma.user.upsert({
      where: { id: u.id as string },
      update: {},
      create: {
        id:       u.id       as string,
        name:     (u.name    as string) || "Unknown",
        email:    (u.email   as string).toLowerCase(),
        password: (u.password as string) || "$2b$10$placeholder",
        role:     (role as never) || "STAFF",
        createdAt:safeDate(u.createdAt) || new Date(),
        updatedAt:safeDate(u.updatedAt) || new Date(),
      },
    });
    if (!FALLBACK_USER_ID) FALLBACK_USER_ID = u.id as string;
    count++;
  }
  console.log(`  ✓ ${count} users`);
}

async function seedSources() {
  console.log("→ Sources");
  const rows = read<Record<string, unknown>>("SourceSupplier.json");
  let count = 0;
  for (const s of rows) {
    if (!s.id || s.isDeleted) continue;
    await prisma.source.upsert({
      where: { id: s.id as string },
      update: {},
      create: {
        id:           s.id as string,
        name:         (s.name as string) || "Unknown",
        region:       s.region    as string | undefined,
        calorieRange: s.calorieRange as string | undefined,
        specGar:      safeDecimal(s.specGar ?? s.gar),
        specTs:       safeDecimal(s.ts),
        specAsh:      safeDecimal(s.ash),
        specTm:       safeDecimal(s.tm),
        specIm:       safeDecimal(s.im),
        specFc:       safeDecimal(s.fc),
        specAdb:      safeDecimal(s.adb),
        specNar:      safeDecimal(s.nar),
        stockAvailable: safeDecimal(s.stockAvailable) ?? 0,
        minStockAlert:  safeDecimal(s.minStockAlert),
        fobBargeOnly:   Boolean(s.fobBargeOnly),
        // v1 stored IDR values in fobBargePriceUsd — clamp large values to IDR field
        fobBargePriceUsd: (() => {
          const v = safeDecimal(s.fobBargePriceUsd);
          return v && v < 999999 ? v : undefined;
        })(),
        fobBargePriceIdr: (() => {
          const v = safeDecimal(s.fobBargePriceUsd);
          return v && v >= 999999 ? v : safeDecimal(s.fobBargePriceIdr);
        })(),
        jettyPort:    s.jettyPort  as string | undefined,
        anchorage:    s.anchorage  as string | undefined,
        kycStatus:    (s.kycStatus as string) || "not_started",
        psiStatus:    (s.psiStatus as string) || "not_started",
        iupNumber:    s.iupNumber  as string | undefined,
        contractType: s.contractType as string | undefined,
        contactPerson: s.picName   as string | undefined,
        notes:        s.statusDetail as string | undefined,
        isActive:     true,
        createdAt:    safeDate(s.createdAt) || new Date(),
        updatedAt:    safeDate(s.updatedAt) || new Date(),
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} sources`);
}

async function seedPartners() {
  console.log("→ Partners");
  const rows = read<Record<string, unknown>>("Partner.json");
  const typeMap: Record<string, string> = {
    buyer:"buyer", supplier:"supplier", vendor:"vendor",
    surveyor:"surveyor", freight:"freight", agent:"agent",
    barge_owner:"barge_owner", bank:"bank", lab:"lab", internal_pic:"internal_pic",
  };
  const valid = rows
    .filter((p) => p.id && !p.isDeleted)
    .map((p) => ({
      id:          p.id as string,
      name:        (p.name as string) || "Unknown",
      type:        typeMap[p.type as string] ?? "vendor",
      country:     (p.country ?? null) as string | null,
      address:     (p.address ?? null) as string | null,
      contactName: (p.contactPerson ?? null) as string | null,
      contactEmail:(p.email ?? null) as string | null,
      contactPhone:(p.phone ?? null) as string | null,
      notes:       (p.notes ?? null) as string | null,
      isActive:    p.status !== "inactive",
      createdAt:   safeDate(p.createdAt) || new Date(),
      updatedAt:   safeDate(p.updatedAt) || new Date(),
    }));

  const BATCH = 50;
  let count = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    await prisma.partner.createMany({ data: valid.slice(i, i + BATCH), skipDuplicates: true });
    count += Math.min(BATCH, valid.length - i);
  }
  console.log(`  ✓ ${count} partners`);
}

async function seedMarketPrices() {
  console.log("→ Market Prices");
  const rows = read<Record<string, unknown>>("MarketPrice.json");
  const fallbackUser = FALLBACK_USER_ID;
  let count = 0;
  for (const m of rows) {
    if (!m.id || m.isDeleted) continue;
    await prisma.marketPrice.upsert({
      where: { id: m.id as string },
      update: {},
      create: {
        id:        m.id as string,
        date:      safeDate(m.date) || new Date(),
        ici1:      safeDecimal(m.ici1),
        ici2:      safeDecimal(m.ici2),
        ici3:      safeDecimal(m.ici3),
        ici4:      safeDecimal(m.ici4),
        ici5:      safeDecimal(m.ici5),
        newcastle: safeDecimal(m.newcastle),
        hba:       safeDecimal(m.hba),
        hba1:      safeDecimal(m.hbaI ?? m.hba1),
        hba2:      safeDecimal(m.hbaII ?? m.hba2),
        hba3:      safeDecimal(m.hbaIII ?? m.hba3),
        source:    (m.source as string)?.slice(0, 100) || "Manual",
        action:    "manual",
        updatedBy: fallbackUser,
        createdAt: safeDate(m.createdAt) || new Date(),
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} market prices`);
}

async function seedForecastProjects() {
  console.log("→ Forecast Projects");
  const rows = read<Record<string, unknown>>("ProjectItem.json");
  const statusMap: Record<string, string> = {
    draft:"draft", waiting_approval:"waiting_approval", approved:"approved",
    rejected:"rejected", revision:"revision", revision_requested:"revision",
    deal:"deal", failed:"failed", cancelled:"cancelled",
    upcoming:"approved", ongoing:"deal", completed:"deal",
  };
  const validUserIds = new Set(
    read<Record<string, unknown>>("User.json").map((u) => u.id as string)
  );

  const valid = rows
    .filter((p) => p.id && !p.isDeleted)
    .map((p) => {
      const createdById = validUserIds.has(p.createdBy as string)
        ? (p.createdBy as string) : FALLBACK_USER_ID;
      const status = statusMap[p.status as string] ?? "draft";
      let roughPl: Record<string, unknown> | null = null;
      if (p.roughPnl) {
        try { roughPl = typeof p.roughPnl === "string" ? JSON.parse(p.roughPnl) : p.roughPnl as Record<string, unknown>; }
        catch { roughPl = null; }
      }
      return {
        id:           p.id as string,
        projectName:  (p.name as string) || "Unnamed Project",
        buyer:        (p.buyer as string) || "Unknown",
        buyerCountry: (p.buyerCountry ?? null) as string | null,
        segment:      (p.segment ?? null) as string | null,
        quantity:     safeDecimal(p.quantity) ?? null,
        laycanStart:  safeDate(p.laycanStart) ?? null,
        laycanEnd:    safeDate(p.laycanEnd) ?? null,
        shippingTerm: (p.salesTerm ?? null) as string | null,
        pol:          (p.portOfLoading ?? null) as string | null,
        salesPriceEst:safeDecimal(p.targetSellingPrice) ?? null,
        specGar:      safeDecimal(p.gar) ?? null,
        specTs:       safeDecimal(p.ts) ?? null,
        specAsh:      safeDecimal(p.ash) ?? null,
        specTm:       safeDecimal(p.tm) ?? null,
        status:       status as never,
        remarks:      (p.notes ?? null) as string | null,
        roughPl:      roughPl as never,
        createdById,
        createdAt:    safeDate(p.createdAt) || new Date(),
        updatedAt:    safeDate(p.updatedAt) || new Date(),
      };
    });

  const BATCH = 50;
  let count = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    await prisma.forecastProject.createMany({ data: valid.slice(i, i + BATCH), skipDuplicates: true });
    count += Math.min(BATCH, valid.length - i);
  }
  console.log(`  ✓ ${count} forecast projects`);
}

async function seedShipments() {
  console.log("→ Shipments (1149 rows)");
  const rows = read<Record<string, unknown>>("ShipmentDetail.json");
  const statusMap: Record<string, string> = {
    upcoming:"upcoming", loading:"loading", in_transit:"in_transit",
    completed:"completed", cancelled:"cancelled",
    done:"completed", "in progress":"loading", active:"loading",
  };

  const valid = rows
    .filter((s) => s.id && !s.isDeleted)
    .map((s) => {
      const status = statusMap[(s.status as string)?.toLowerCase()] ?? "upcoming";
      const type = (s.exportDmo as string)?.toLowerCase().includes("dom") ? "domestic" : "export";
      const shipNum = (s.vesselName as string)?.trim() || `SH-${(s.id as string).slice(-8)}`;
      return {
        id:             s.id as string,
        shipmentNumber: shipNum,
        type:           type as "export" | "domestic",
        buyer:          (s.buyer as string) || "Unknown",
        buyerCountry:   (s.buyerCountry ?? null) as string | null,
        product:        "Coal",
        qtyPlan:        safeDecimal(s.quantityLoaded ?? s.quantityPlan) ?? null,
        qtyLoaded:      safeDecimal(s.quantityLoaded) ?? null,
        salesPrice:     safeDecimal(s.salesPrice ?? s.sp ?? s.hargaActualFobMv) ?? null,
        buyingPrice:    safeDecimal(s.buyingPrice ?? s.hargaActualFob ?? s.hpb) ?? null,
        freightRate:    safeDecimal(s.priceFreight ?? s.shippingRate) ?? null,
        royaltyCost:    safeDecimal(s.royaltiPerMt) ?? null,
        marginMt:       safeDecimal(s.marginMt ?? s.margin_mt) ?? null,
        pol:            (s.loadingPort ?? null) as string | null,
        pod:            (s.dischargePort ?? null) as string | null,
        vesselName:     (s.mvName ?? null) as string | null,
        bargeName:      (s.bargeName ?? null) as string | null,
        source:         (s.iupOp ?? null) as string | null,
        supplier:       (s.supplier ?? null) as string | null,
        region:         (s.area ?? null) as string | null,
        specGar:        safeDecimal(s.gar ?? s.garSpec) ?? null,
        specTs:         safeDecimal(s.ts ?? s.tsSpec) ?? null,
        specAsh:        safeDecimal(s.ash ?? s.ashSpec) ?? null,
        specTm:         safeDecimal(s.tm ?? s.tmSpec) ?? null,
        blDate:         safeDate(s.blDate) ?? null,
        eta:            safeDate(s.eta) ?? null,
        status:         status as "upcoming" | "loading" | "in_transit" | "completed" | "cancelled",
        pic:            (s.picName ?? null) as string | null,
        createdById:    FALLBACK_USER_ID,
        createdAt:      safeDate(s.createdAt) || new Date(),
        updatedAt:      safeDate(s.updatedAt) || new Date(),
      };
    });

  // Deduplicate shipmentNumber (v1 had duplicates)
  const seen = new Set<string>();
  const deduped = valid.filter((s) => {
    if (seen.has(s.shipmentNumber)) {
      s.shipmentNumber = `${s.shipmentNumber}-${s.id.slice(-4)}`;
    }
    seen.add(s.shipmentNumber);
    return true;
  });

  const BATCH = 100;
  let count = 0;
  for (let i = 0; i < deduped.length; i += BATCH) {
    await prisma.shipment.createMany({ data: deduped.slice(i, i + BATCH), skipDuplicates: true });
    count += Math.min(BATCH, deduped.length - i);
    process.stdout.write(`\r  … ${count}/${deduped.length}`);
  }
  console.log(`\n  ✓ ${count} shipments`);
}

async function seedShipmentDocuments() {
  console.log("→ Shipment Documents");
  const rows = read<Record<string, unknown>>("ShipmentDocument.json");
  let count = 0;
  for (const d of rows) {
    if (!d.id || d.isDeleted) continue;
    // Verify shipment exists
    const exists = await prisma.shipment.findUnique({ where: { id: d.shipmentId as string }, select: { id: true } });
    if (!exists) continue;
    await prisma.shipmentDocument.upsert({
      where: { id: d.id as string },
      update: {},
      create: {
        id:              d.id as string,
        shipmentId:      d.shipmentId as string,
        requirementCode: (d.requirementCode as string) || "a",
        label:           (d.requirementLabel ?? d.title) as string || "Document",
        status:          (d.status as never) || "pending",
        fileUrl:         d.storageUrl as string | undefined,
        fileName:        d.fileName as string | undefined,
        fileSize:        d.sizeBytes ? Number(d.sizeBytes) : undefined,
        uploadedBy:      d.uploadedByName as string | undefined,
        uploadedAt:      safeDate(d.createdAt),
      },
    }).catch(() => { /* skip unique constraint conflicts */ });
    count++;
  }
  console.log(`  ✓ ${count} shipment documents`);
}

async function seedQualityResults() {
  console.log("→ Quality Results");
  const rows = read<Record<string, unknown>>("QualityResult.json");
  let count = 0;
  for (const q of rows) {
    if (!q.id || q.isDeleted) continue;
    await prisma.qualityResult.upsert({
      where: { id: q.id as string },
      update: {},
      create: {
        id:          q.id as string,
        cargoId:     (q.cargoId as string) || q.id as string,
        cargoName:   (q.cargoName as string) || "Unknown",
        shipmentId:  q.cargoId as string | undefined,
        surveyor:    q.surveyor as string | undefined,
        samplingDate:safeDate(q.samplingDate),
        status:      (q.status as never) || "pending",
        specResult:  { gar: q.gar, ts: q.ts, ash: q.ash, tm: q.tm } as never,
        contractSpec:q.contractSpec as never,
        warningNotes:q.warningNotes as string | undefined,
        createdAt:   safeDate(q.createdAt) || new Date(),
        updatedAt:   safeDate(q.updatedAt) || new Date(),
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} quality results`);
}

async function seedDailyDelivery() {
  console.log("→ Daily Delivery (164 rows)");
  const rows = read<Record<string, unknown>>("DailyDelivery.json");
  const valid = rows
    .filter((d) => d.id)
    .map((d) => ({
      id:           d.id as string,
      blDate:       safeDate(d.blDate) || safeDate(d.createdAt) || new Date(),
      buyer:        (d.buyer as string) || "Unknown",
      supplier:     (d.supplier as string) || "",
      shippingTerm: (d.shippingTerm as string) || "FOB",
      area:         (d.area ?? null) as string | null,
      flow:         (d.flow as string) || "export",
      blQty:        safeDecimal(d.blQuantity) ?? 0,
      invoiceAmount:(d.invoiceAmount ? safeDecimal(d.invoiceAmount) : null) as number | null,
      product:      (d.product as string) || "Coal",
      projectName:  (d.project ?? null) as string | null,
      createdAt:    safeDate(d.createdAt) || new Date(),
      updatedAt:    safeDate(d.updatedAt) || new Date(),
    }));
  const BATCH = 50;
  let count = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    await prisma.dailyDeliveryLog.createMany({ data: valid.slice(i, i + BATCH), skipDuplicates: true });
    count += Math.min(BATCH, valid.length - i);
  }
  console.log(`  ✓ ${count} daily delivery logs`);
}

async function seedTasks() {
  console.log("→ Tasks");
  const rows = read<Record<string, unknown>>("TaskItem.json");
  const validUserIds = new Set(
    read<Record<string, unknown>>("User.json").map((u) => u.id as string)
  );
  const valid = rows
    .filter((t) => t.id && !t.isDeleted)
    .map((t) => ({
      id:          t.id as string,
      title:       (t.title as string) || "Task",
      description: (t.description ?? null) as string | null,
      status:      (t.status as never) || "todo",
      priority:    (t.priority as never) || "medium",
      dueDate:     safeDate(t.dueDate) ?? null,
      createdById: validUserIds.has(t.createdBy as string) ? (t.createdBy as string) : FALLBACK_USER_ID,
      createdAt:   safeDate(t.createdAt) || new Date(),
      updatedAt:   safeDate(t.updatedAt) || new Date(),
    }));
  await prisma.task.createMany({ data: valid, skipDuplicates: true });
  console.log(`  ✓ ${valid.length} tasks`);
}

async function seedMeetings() {
  console.log("→ Meetings");
  const rows = read<Record<string, unknown>>("MeetingItem.json");
  const validUserIds = new Set(
    read<Record<string, unknown>>("User.json").map((u) => u.id as string)
  );
  const valid = rows
    .filter((m) => m.id && !m.isDeleted)
    .map((m) => {
      const participants = (() => {
        try { return JSON.parse(m.attendees as string) as string[]; } catch { return []; }
      })();
      return {
        id:          m.id as string,
        title:       (m.title as string) || "Meeting",
        scheduledAt: safeDate(m.date) || new Date(),
        location:    (m.location ?? null) as string | null,
        participants,
        status:      (m.status as string) || "scheduled",
        momContent:  (m.momContent ?? null) as string | null,
        createdById: validUserIds.has(m.createdBy as string) ? (m.createdBy as string) : FALLBACK_USER_ID,
        createdAt:   safeDate(m.createdAt) || new Date(),
        updatedAt:   safeDate(m.updatedAt) || new Date(),
      };
    });
  await prisma.meeting.createMany({ data: valid, skipDuplicates: true });
  console.log(`  ✓ ${valid.length} meetings`);
}

async function seedBlendingSimulations() {
  console.log("→ Blending Simulations");
  const rows = read<Record<string, unknown>>("BlendingSimulation.json");
  let count = 0;
  for (const b of rows) {
    if (!b.id || b.isDeleted) continue;
    const cargos = (() => {
      try { return JSON.parse(b.inputs as string); } catch { return []; }
    })();
    await prisma.blendingSimulation.upsert({
      where: { id: b.id as string },
      update: {},
      create: {
        id:     b.id as string,
        name:   `Blend ${new Date(b.createdAt as string).toLocaleDateString()}`,
        cargos: cargos as never,
        result: {
          totalQty: b.totalQuantity, gar: b.resultGar,
          ts: b.resultTs, ash: b.resultAsh, tm: b.resultTm,
        } as never,
        createdAt: safeDate(b.createdAt) || new Date(),
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} blending simulations`);
}

async function seedAuditLogs() {
  console.log("→ Audit Logs (219 rows)");
  const rows = read<Record<string, unknown>>("AuditLog.json");
  const validUserIds = new Set(
    read<Record<string, unknown>>("User.json").map((u) => u.id as string)
  );

  const valid = rows
    .filter((a) => a.id)
    .map((a) => {
      const userId = validUserIds.has(a.userId as string) ? (a.userId as string) : FALLBACK_USER_ID;
      let details: Record<string, unknown> | undefined;
      if (a.details) {
        try { details = JSON.parse(a.details as string); } catch { details = { raw: String(a.details).slice(0, 200) }; }
      }
      return {
        id:        a.id as string,
        userId,
        userRole:  "STAFF",
        action:    ((a.action as string) || "unknown").toLowerCase(),
        entity:    ((a.entity as string) || "unknown").toLowerCase(),
        entityId:  (a.entityId ?? null) as string | null,
        details:   (details ?? null) as never,
        createdAt: safeDate(a.createdAt) || new Date(),
      };
    });

  const BATCH = 50;
  let count = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    await prisma.auditLog.createMany({ data: valid.slice(i, i + BATCH), skipDuplicates: true });
    count += Math.min(BATCH, valid.length - i);
  }
  console.log(`  ✓ ${count} audit logs`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 CoalOS v1 → v2 Database Seed");
  console.log("================================\n");
  const start = Date.now();

  try {
    // Dependency order matters — foreign keys
    await seedUsers();
    await seedSources();
    await seedPartners();
    await seedMarketPrices();
    await seedForecastProjects();
    await seedShipments();
    await seedShipmentDocuments();
    await seedQualityResults();
    await seedDailyDelivery();
    await seedTasks();
    await seedMeetings();
    await seedBlendingSimulations();
    await seedAuditLogs();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Seed complete in ${elapsed}s`);
    console.log("\nSummary:");
    const [users, sources, partners, prices, forecasts, shipments, quality, delivery, tasks, meetings] = await Promise.all([
      prisma.user.count(),
      prisma.source.count(),
      prisma.partner.count(),
      prisma.marketPrice.count(),
      prisma.forecastProject.count(),
      prisma.shipment.count(),
      prisma.qualityResult.count(),
      prisma.dailyDeliveryLog.count(),
      prisma.task.count(),
      prisma.meeting.count(),
    ]);
    console.table({ users, sources, partners, marketPrices: prices, forecastProjects: forecasts, shipments, qualityResults: quality, dailyDelivery: delivery, tasks, meetings });
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

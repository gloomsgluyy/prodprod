import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const BACKUP = path.join(__dirname, "../CoalOS_DB_Backup_2026-07-10T14-10-17");
const APPLY = process.argv.includes("--apply");

for (const line of fs.existsSync(path.join(__dirname, "../.env")) ? fs.readFileSync(path.join(__dirname, "../.env"), "utf-8").split(/\r?\n/) : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const prisma = new PrismaClient();

function read(file: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(BACKUP, file), "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeDecimal(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function safeDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : undefined;
}

async function main() {
  const backupShipments = new Map(read("ShipmentDetail.json").map((s) => [String(s.id), s]));
  const backupForecasts = new Map(read("ForecastProject.json").map((s) => [String(s.id), s]));

  const shipments = await prisma.shipment.findMany({
    select: { id: true, qtyPlan: true, qtyLoaded: true, salesPrice: true, buyingPrice: true, blDate: true, eta: true, createdAt: true },
  });
  const forecasts = await prisma.forecastProject.findMany({
    select: { id: true, quantity: true, salesPriceEst: true, laycanStart: true, createdAt: true },
  });

  let shipmentFixes = 0;
  let forecastFixes = 0;
  let aprilCreatedNoBusinessDate = 0;

  for (const s of shipments) {
    const b = backupShipments.get(s.id);
    const data: Record<string, unknown> = {};
    if (!b) continue;

    if (s.qtyPlan == null) data.qtyPlan = safeDecimal(b.quantityLoaded ?? b.quantityPlan) ?? undefined;
    if (s.qtyLoaded == null) data.qtyLoaded = safeDecimal(b.quantityLoaded) ?? undefined;
    if (s.salesPrice == null) data.salesPrice = safeDecimal(b.salesPrice ?? b.sp ?? b.hargaActualFobMv) ?? undefined;
    if (s.buyingPrice == null) data.buyingPrice = safeDecimal(b.buyingPrice ?? b.hargaActualFob ?? b.hpb) ?? undefined;
    if (s.blDate == null) data.blDate = safeDate(b.blDate) ?? undefined;
    if (s.eta == null) data.eta = safeDate(b.eta) ?? undefined;
    if (!s.blDate && !s.eta && s.createdAt.getFullYear() === 2026 && s.createdAt.getMonth() === 3) aprilCreatedNoBusinessDate++;

    for (const [k, v] of Object.entries(data)) if (v === undefined) delete data[k];
    if (Object.keys(data).length === 0) continue;
    shipmentFixes++;
    if (APPLY) await prisma.shipment.update({ where: { id: s.id }, data });
  }

  for (const f of forecasts) {
    const b = backupForecasts.get(f.id);
    const data: Record<string, unknown> = {};
    if (!b) continue;

    if (f.quantity == null) data.quantity = safeDecimal(b.quantity) ?? undefined;
    if (f.salesPriceEst == null) data.salesPriceEst = safeDecimal(b.targetSellingPrice) ?? undefined;
    if (f.laycanStart == null) data.laycanStart = safeDate(b.laycanStart) ?? undefined;

    for (const [k, v] of Object.entries(data)) if (v === undefined) delete data[k];
    if (Object.keys(data).length === 0) continue;
    forecastFixes++;
    if (APPLY) await prisma.forecastProject.update({ where: { id: f.id }, data });
  }

  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", shipmentFixes, forecastFixes, aprilCreatedNoBusinessDate }, null, 2));
}

main().finally(() => prisma.$disconnect());

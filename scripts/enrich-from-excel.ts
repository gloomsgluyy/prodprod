import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const EXCEL_PATH = path.join(__dirname, "../10.Daily Delivery Report (Recap Shipment) 2020, 2021, 2022, 2023, 2024, 2025, 2026.xlsx");
const APPLY = process.argv.includes("--apply");

for (const line of require("fs").existsSync(path.join(__dirname, "../.env")) ? require("fs").readFileSync(path.join(__dirname, "../.env"), "utf-8").split(/\r?\n/) : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const prisma = new PrismaClient();

function safeDecimal(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const str = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(str);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
}

function excelDateToJS(serial: unknown): Date | undefined {
  if (typeof serial !== "number" || serial <= 0) return undefined;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info;
}

function parseLaycan(laycan: unknown, year: number): Date | undefined {
  if (!laycan || typeof laycan !== "string") return undefined;
  const match = laycan.match(/(\d+)\s*-\s*(\d+)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (!match) return undefined;
  const monthMap: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const startDay = parseInt(match[1], 10);
  const month = monthMap[match[3].toLowerCase()];
  if (month === undefined) return undefined;
  return new Date(year, month, startDay);
}

async function processSheet(sheetName: string, year: number, type: "export" | "domestic") {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return { enriched: 0, created: 0 };

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, range: 1 }) as any[];
  const dataRows = rows.filter((r: any) => r["Status "] && r["Buyer"]);

  const systemUser = await prisma.user.findFirst({ where: { role: "CEO" } });
  if (!systemUser) throw new Error("No CEO user found for createdById");

  let enriched = 0;
  let created = 0;

  for (const row of dataRows) {
    const r = row as any;
    const projectName = r["Project Name"];
    const vesselNomination = r["Vessel Nomination"];
    
    if (!projectName && !vesselNomination) continue;
    
    const whereConditions = [];
    if (projectName) whereConditions.push({ vesselName: { contains: projectName } });
    if (vesselNomination) whereConditions.push({ vesselName: { contains: vesselNomination } });
    
    const existing = await prisma.shipment.findFirst({
      where: { OR: whereConditions },
    });

    const blDate = excelDateToJS(r["BL Date"]);
    const laycanStart = parseLaycan(r["Laycan POL"], year);
    const qtyLoaded = safeDecimal(r["BL Quantity"]);
    const salesPrice = safeDecimal(r["Price After Adjustment"]) ?? safeDecimal(r["__EMPTY_1"]);
    const buyingPrice = safeDecimal(r["HPB"]);

    const shipmentNumber = `EXCEL-${year}-${type.toUpperCase().substring(0,3)}-${String(dataRows.indexOf(row) + 1).padStart(3, "0")}`;
    
    const data: any = {
      shipmentNumber,
      type,
      status: r["Status "] === "Done" ? "completed" : "in_transit",
      buyer: r["Buyer"] || undefined,
      supplier: r["Source"] || undefined,
      vesselName: projectName || vesselNomination || undefined,
      pol: r["POL"] || undefined,
      qtyLoaded: qtyLoaded ?? undefined,
      blDate: blDate ?? undefined,
      laycanStart: laycanStart ?? undefined,
      salesPrice: salesPrice ?? undefined,
      buyingPrice: buyingPrice ?? undefined,
      source: r["Source"] || undefined,
      region: r["Area"] || undefined,
      shippingTerm: r["Shipping Term"] || undefined,
    };

    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) delete data[k];
    }

    if (existing) {
      const updates: any = {};
      if (!existing.blDate && data.blDate) updates.blDate = data.blDate;
      if (!existing.laycanStart && data.laycanStart) updates.laycanStart = data.laycanStart;
      if (!existing.qtyLoaded && data.qtyLoaded) updates.qtyLoaded = data.qtyLoaded;
      if (!existing.salesPrice && data.salesPrice) updates.salesPrice = data.salesPrice;
      if (!existing.buyingPrice && data.buyingPrice) updates.buyingPrice = data.buyingPrice;
      if (!existing.buyer && data.buyer) updates.buyer = data.buyer;
      if (!existing.supplier && data.supplier) updates.supplier = data.supplier;
      if (!existing.region && data.region) updates.region = data.region;

      if (Object.keys(updates).length > 0) {
        if (APPLY) await prisma.shipment.update({ where: { id: existing.id }, data: updates });
        enriched++;
      }
    } else {
      data.createdById = systemUser.id;
      if (APPLY) await prisma.shipment.create({ data });
      created++;
    }
  }

  return { enriched, created };
}

async function main() {
  const stats = {
    "2026-EXP": await processSheet("2026-EXP", 2026, "export"),
    "2026-DOM": await processSheet("2026-DOM", 2026, "domestic"),
    "2025-EXP": await processSheet("2025-EXP", 2025, "export"),
    "2025-DOM": await processSheet("2025-DOM", 2025, "domestic"),
  };

  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", stats }, null, 2));
}

main().finally(() => prisma.$disconnect());

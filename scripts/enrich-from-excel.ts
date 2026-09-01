import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const MV_FILE = path.join(ROOT, "00. MV_Barge&Source 2021,2022, 2023,2024-7-19.xlsx");
const DELIVERY_FILE = path.join(ROOT, "10.Daily Delivery Report (Recap Shipment) 2020, 2021, 2022, 2023, 2024, 2025, 2026.xlsx");
const APPLY = process.argv.includes("--apply");
const REPORT = path.join(ROOT, "docs_rewrite", "excel-import-dry-run.json");
const prisma = new PrismaClient();

type Row = Record<string, unknown>;
type Candidate = {
  sourceFile: string; sheet: string; row: number; year: number; type: "export" | "domestic";
  mv: string; buyer?: string; entity?: string; supplier?: string; source?: string; iupOp?: string;
  loadingPort?: string; nomination?: string; plan?: number; actual?: number; status?: string; issue?: string;
  blDate?: Date; project?: string; pol?: string; pod?: string; shippingTerm?: string;
  imoNumber?: string; vesselType?: string; vesselDwt?: number; agentAtPol?: string; agentAtPod?: string; notifyParty?: string; stowagePlan?: string;
  blQty?: number; dischargedQty?: number; factoryQty?: number; contractNo?: string; contractType?: string; marketSection?: string;
  lcIssuingBank?: string; beneficiaryBank?: string; advisingBank?: string; paymentDueDate?: Date; paymentReceived?: Date;
  polSurveyor?: string; podSurveyor?: string; surveyorLs?: string; analysisMethod?: string;
  lhvIssued?: boolean; lhvIssuedDate?: Date;
  laycanStart?: Date; laycanEnd?: Date; paymentStatus?: string; invoiceAmount?: number;
  quality?: Record<string, unknown>; provenance: Record<string, unknown>;
};

function text(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const result = String(value).replace(/\s+/g, " ").trim();
  return result || undefined;
}

function number(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value !== 0 ? value : undefined;
  const result = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(result) && result !== 0 ? result : undefined;
}

function excelDate(value: unknown): Date | undefined {
  if (typeof value === "number" && value > 0) return new Date(Math.round((value - 25569) * 86400) * 1000);
  const raw = text(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function range(value: unknown, year: number): { start?: Date; end?: Date } {
  const raw = text(value);
  if (!raw) return {};
  const match = raw.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return { start: excelDate(raw) };
  const month = new Date(`${match[3]} 1, ${year}`).getMonth();
  if (Number.isNaN(month)) return {};
  return { start: new Date(year, month, Number(match[1])), end: new Date(year, month, Number(match[2])) };
}

function find(row: Row, names: string[]): unknown {
  const keys = Object.keys(row);
  const key = keys.find((candidate) => names.some((name) => candidate.trim().toLowerCase() === name.trim().toLowerCase()));
  return key ? row[key] : undefined;
}

function cell(row: unknown[], headers: string[], names: string[]): unknown {
  const index = headers.findIndex((header) => names.some((name) => header.trim().toLowerCase() === name.trim().toLowerCase()));
  return index >= 0 ? row[index] : undefined;
}

function workbookRows(file: string, year: number, type: "export" | "domestic"): Candidate[] {
  if (!fs.existsSync(file)) return [];
  const workbook = XLSX.readFile(file, { cellDates: false });
  const result: Candidate[] = [];
  for (const sheetName of workbook.SheetNames) {
    if (/outstanding|source monitoring|sales plan|hasil/i.test(sheetName)) continue;
    const sheetYear = Number(sheetName.match(/20\d{2}/)?.[0] ?? year);
    const sheetType = /dom/i.test(sheetName) ? "domestic" : type;
    const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: undefined, range: 1 });
    let currentParent: string | undefined;
    rows.forEach((row, index) => {
      const parentValue = text(find(row, ["MV NAME", "MV./PROJECT NAME"]));
      const nominationValue = text(find(row, ["TB./BG.", "TB./BG. ", "NOMINATION", "Barge Nomination", "MV/Barge Nomination", "Barge/MV Nomination"]));
      const projectValue = text(find(row, ["Project Name"]));
      const explicitParent = parentValue ?? (nominationValue && /^mv\b/i.test(nominationValue) ? nominationValue : undefined) ?? (projectValue && /^mv\b/i.test(projectValue) ? projectValue : undefined);
      if (explicitParent && !isBargeOnly(explicitParent)) currentParent = explicitParent;
      const mv = currentParent;
      const buyer = text(find(row, ["BUYER", "Buyer"]));
      if (!mv || (file === DELIVERY_FILE && !buyer)) return;
      const laycan = range(find(row, ["LAYCAN", "Laycan", "Laycan at POL", "Laycan at the POL"]), sheetYear);
      const nomination = nominationValue;
      const source = text(find(row, ["SOURCE", "Source"]));
      const supplier = text(find(row, ["IUP OP", "Supplier", "IUP-OPK"]));
      const project = projectValue ?? text(find(row, ["PROJECT NAME", "MV./PROJECT NAME"]));
      result.push({
        sourceFile: path.basename(file), sheet: sheetName, row: index + 2, year: sheetYear, type: sheetType, mv, buyer,
        entity: text(find(row, ["MSE/BPG", "Entity"])), supplier, source, iupOp: supplier,
        loadingPort: text(find(row, ["JETTY", "JETTY / LOADING PORT", "POL"])), nomination,
        plan: number(find(row, ["QTY (MT)", "QTY", "BL Quantity", "BL QUANTITY"])),
        actual: number(find(row, ["COB", "ACTUAL", "POD Quantity", "POD/Weightbridge Quantity", "Weightbridge Quantity"])),
        status: text(find(row, ["SHIPMENT STATUS", "Shipment Status", "STATUS"])),
        issue: text(find(row, ["ISSUE", "ISSUE / NOTES", "REMARKS", "Any Notes", "Notes"])),
        blDate: excelDate(find(row, ["BL DATE", "BL Date"])), project,
        imoNumber: text(find(row, ["IMO", "IMO No.", "IMO NUMBER"])), vesselType: text(find(row, ["Vessel Type"])), vesselDwt: number(find(row, ["Vessel DWT", "DWT"])),
        agentAtPol: text(find(row, ["Agent at POL"])), agentAtPod: text(find(row, ["Agent at POD"])), notifyParty: text(find(row, ["Notify Party", "Notify Party, Country"])), stowagePlan: text(find(row, ["Stowage Plan"])),
        blQty: number(find(row, ["BL Quantity", "BL QUANTITY"])), dischargedQty: number(find(row, ["Discharged Quantity", "Complete Discharged", "POD Quantity"])), factoryQty: number(find(row, ["Weightbridge Quantity", "POD/Weightbridge Quantity"])),
        contractNo: text(find(row, ["Contract No.", "PO/Contract No.", "SOURCE (CONTRACT)"])), contractType: text(find(row, ["Contract w. Buyer Type (Spot/Term)", "Contract Type"])), marketSection: text(find(row, ["MSE/BPG", "Market Section"])),
        lcIssuingBank: text(find(row, ["LC Issuing Bank"])), beneficiaryBank: text(find(row, ["Beneficiary Bank"])), advisingBank: text(find(row, ["Advising Bank"])), paymentDueDate: excelDate(find(row, ["Payment Due Date"])), paymentReceived: excelDate(find(row, ["Received Payment Date"])),
        polSurveyor: text(find(row, ["POL Surveyor", "Surveyor POL"])), podSurveyor: text(find(row, ["POD Surveyor", "Surveyor POD"])), surveyorLs: text(find(row, ["Surveyor LS"])), analysisMethod: text(find(row, ["ANALYSIS METHOD", "Analysis Method"])),
        lhvIssued: !!text(find(row, ["LHV Terbit", "LHV"])), lhvIssuedDate: excelDate(find(row, ["LHV Terbit"])),
        pol: text(find(row, ["POL"])), pod: text(find(row, ["POD", "Port & Country of POD"])),
        shippingTerm: text(find(row, ["SHIPPING", "Shipping Term"])), laycanStart: laycan.start, laycanEnd: laycan.end,
        paymentStatus: text(find(row, ["Payment Status", "Payment Status /Paid", "STATUS PAYMENT"])),
        invoiceAmount: number(find(row, ["Invoice Amount", "INVOICE AMOUNT", "Tota Invoice"])),
        quality: { gar: find(row, ["GAR", "ACTUAL GAR", "ACTUAL GCV (GAR&GAD)"]), nar: find(row, ["NAR", "ACTUAL NAR"]), tm: find(row, ["TM (ARB)", "ACTUAL TM (ARB)"]), ts: find(row, ["TS (ADB)", "ACTUAL TS (ADB)"]), ash: find(row, ["ASH (ADB)", "ACTUAL ASH (ADB)"]) },
        provenance: { file: path.basename(file), sheet: sheetName, row: index + 2 },
      });
    });
  }
  return result;
}

function normalize(value: string | undefined): string { return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isBargeOnly(value: string | undefined): boolean { return /^(tb|bg)\b/i.test(value?.trim() ?? ""); }

function parentKey(candidate: Candidate): string { return normalize(candidate.mv); }

async function main() {
  const candidates = [
    ...workbookRows(MV_FILE, 2024, "export"),
    ...workbookRows(DELIVERY_FILE, 2026, "export"),
  ];
  const grouped = new Map<string, Candidate[]>();
  for (const candidate of candidates) grouped.set(parentKey(candidate), [...(grouped.get(parentKey(candidate)) ?? []), candidate]);
  const report = { mode: APPLY ? "apply" : "dry-run", generatedAt: new Date().toISOString(), candidates: candidates.length, parents: 0, children: 0, enriched: 0, created: 0, conflicts: [] as unknown[], provenance: [] as unknown[] };

  if (!APPLY) {
    for (const [key, rows] of grouped) {
      const first = rows[0];
      report.parents++;
      report.children += rows.filter((row) => row.nomination).length;
      report.provenance.push({ parentKey: key, sample: first.mv, rows: rows.map((row) => row.provenance) });
      if (new Set(rows.map((row) => normalize(row.mv))).size > 1) report.conflicts.push({ type: "parent_name_conflict", key, rows: rows.map((row) => row.provenance) });
      if (rows.every((row) => isBargeOnly(row.mv))) report.conflicts.push({ type: "barge_without_parent", key, rows: rows.map((row) => row.provenance) });
    }
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, report: path.relative(ROOT, REPORT) }, null, 2));
    return;
  }

  for (const [key, rows] of grouped) {
    const first = rows[0];
    const existing = await prisma.shipment.findFirst({ where: { OR: [{ shipmentNumber: first.mv }, { vesselName: { contains: first.mv, mode: "insensitive" } }] } });
    const duplicateMVs = new Set(rows.map((row) => normalize(row.mv)));
    if (duplicateMVs.size > 1) report.conflicts.push({ type: "parent_name_conflict", key, rows: rows.map((row) => row.provenance) });
    if (rows.every((row) => isBargeOnly(row.mv))) { report.conflicts.push({ type: "barge_without_parent", key, rows: rows.map((row) => row.provenance) }); continue; }
    const data = {
      shipmentNumber: existing?.shipmentNumber ?? `EXCEL-MV-${String(report.parents + 1).padStart(5, "0")}`,
      type: first.type, buyer: first.buyer ?? "Unknown", product: "Coal", vesselName: first.mv,
      buyerCountry: first.pod, source: first.source, supplier: first.supplier, iupOp: first.iupOp,
      pol: first.pol ?? first.loadingPort, pod: first.pod, shippingTerm: first.shippingTerm,
      qtyPlan: first.plan, qtyLoaded: first.actual, blDate: first.blDate,
      laycanStart: first.laycanStart, laycanEnd: first.laycanEnd,
      status: /done|complete|discharg/i.test(first.status ?? "") ? "completed" : "in_transit",
      region: first.entity,
      imoNumber: first.imoNumber, vesselType: first.vesselType, vesselDwt: first.vesselDwt, agentAtPol: first.agentAtPol, agentAtPod: first.agentAtPod, notifyParty: first.notifyParty, stowagePlan: first.stowagePlan,
      blQty: first.blQty, dischargedQty: first.dischargedQty, factoryQty: first.factoryQty, contractNo: first.contractNo, contractType: first.contractType, marketSection: first.marketSection,
      lcIssuingBank: first.lcIssuingBank, beneficiaryBank: first.beneficiaryBank, advisingBank: first.advisingBank, paymentDueDate: first.paymentDueDate, paymentReceived: first.paymentReceived, invoiceAmount: first.invoiceAmount,
      polSurveyor: first.polSurveyor, podSurveyor: first.podSurveyor, surveyorLs: first.surveyorLs, analysisMethod: first.analysisMethod,
      lhvIssued: first.lhvIssued, lhvIssuedDate: first.lhvIssuedDate,
    } as Record<string, unknown>;
    report.parents++;
    report.provenance.push({ parent: data.shipmentNumber, rows: rows.map((row) => row.provenance) });
    if (APPLY) {
      const user = await prisma.user.findFirst({ where: { role: "CEO" }, select: { id: true } });
      if (!user) throw new Error("No CEO user found for importer actor");
      const parent = existing ?? await prisma.shipment.create({ data: { ...data, createdById: user.id } as never });
      if (existing) await prisma.shipment.update({ where: { id: existing.id }, data: Object.fromEntries(Object.entries(data).filter(([field, value]) => field !== "shipmentNumber" && value !== undefined)) as never });
      for (const row of rows.filter((candidate) => candidate.nomination)) {
        const child = await prisma.childNomination.upsert({ where: { nominationNumber: row.nomination! }, update: { motherShipmentId: parent.id, source: row.source, supplier: row.supplier, loadingPort: row.loadingPort, plannedQty: row.plan, loadedQty: row.actual, blDate: row.blDate, laycanStart: row.laycanStart, laycanEnd: row.laycanEnd, lhvIssued: row.lhvIssued, lhvIssuedDate: row.lhvIssuedDate, status: /done|complete|discharg/i.test(row.status ?? "") ? "completed" : "active", notes: row.issue }, create: { motherShipmentId: parent.id, nominationNumber: row.nomination!, bargeName: row.nomination!, source: row.source, supplier: row.supplier, loadingPort: row.loadingPort, plannedQty: row.plan, loadedQty: row.actual, blDate: row.blDate, laycanStart: row.laycanStart, laycanEnd: row.laycanEnd, lhvIssued: row.lhvIssued ?? false, lhvIssuedDate: row.lhvIssuedDate, status: /done|complete|discharg/i.test(row.status ?? "") ? "completed" : "active", notes: row.issue, createdById: user.id } });
        report.children++; report.provenance.push({ child: child.id, parent: parent.id, row: row.provenance });
      }
    } else {
      report.children += rows.filter((row) => row.nomination).length;
    }
  }
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, report: path.relative(ROOT, REPORT) }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

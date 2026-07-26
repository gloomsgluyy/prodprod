/**
 * PDF Generator — Server-side PDF creation using pdf-lib.
 * Used by SI, FCO, and Summary Report API routes.
 *
 * All functions return Uint8Array (raw PDF bytes) which callers
 * then pass to saveFile() for persistence.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BLACK  = rgb(0, 0, 0);
const DARK   = rgb(0.1, 0.1, 0.1);
const GREY   = rgb(0.5, 0.5, 0.5);
const ACCENT = rgb(0.08, 0.37, 0.62);
const WHITE  = rgb(1, 1, 1);
const LINE   = rgb(0.8, 0.8, 0.8);

interface DrawContext {
  page: PDFPage;
  bold: PDFFont;
  regular: PDFFont;
  width: number;
  y: number;
}

function text(ctx: DrawContext, str: string, x: number, opts: {
  size?: number; font?: PDFFont; color?: (typeof BLACK); align?: "left"|"right"|"center";
} = {}) {
  const font  = opts.font ?? ctx.regular;
  const size  = opts.size ?? 10;
  const color = opts.color ?? BLACK;
  let drawX = x;
  if (opts.align === "right") {
    drawX = x - font.widthOfTextAtSize(str, size);
  } else if (opts.align === "center") {
    drawX = x - font.widthOfTextAtSize(str, size) / 2;
  }
  ctx.page.drawText(str, { x: drawX, y: ctx.y, size, font, color });
}

function line(ctx: DrawContext, x1: number, x2: number, yOffset = 0) {
  ctx.page.drawLine({
    start: { x: x1, y: ctx.y + yOffset },
    end:   { x: x2, y: ctx.y + yOffset },
    thickness: 0.5,
    color: LINE,
  });
}

function rect(ctx: DrawContext, x: number, w: number, h: number, color: typeof BLACK) {
  ctx.page.drawRectangle({ x, y: ctx.y, width: w, height: h, color });
}

function wrapText(str: string, maxChars: number): string[] {
  if (!str) return [""];
  const words = str.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.length ? lines : [""];
}

// ─── SI PDF ──────────────────────────────────────────────────────────────────

export interface SIData {
  siNumber:          string;
  version:           number;
  shipmentNumber?:   string;
  forecastName?:     string;
  buyer:             string;
  supplier:          string;
  source:            string;
  pol:               string;
  pod:               string;
  laycanStart:       string;
  laycanEnd:         string;
  product:           string;
  coalSpec:          Record<string, unknown>;
  quantity:          number;
  tolerance?:        string;
  vesselBarge:       string;
  contractReference: string;
  documentRequired?: string;
  remarks?:          string;
  isEarly?:          boolean;
  generatedDate:     string;
}

export async function generateSIPdf(si: SIData): Promise<Uint8Array> {
  const doc   = await PDFDocument.create();
  const page  = doc.addPage([595, 842]); // A4
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, y: 800 };

  const M = 50; // left margin
  const R = width - 50; // right edge

  // ── Header bar ──
  rect(ctx, 0, width, 30, ACCENT);
  ctx.y += 9;
  text(ctx, "SHIPPING INSTRUCTION", M, { font: bold, size: 14, color: WHITE });
  text(ctx, si.siNumber, R, { font: bold, size: 10, color: WHITE, align: "right" });
  ctx.y -= 45;

  // ── Kop space (intentionally blank per SRS) ──
  ctx.y -= 25;
  text(ctx, `SI Number: ${si.siNumber}  |  Version: ${si.version}  |  Date: ${si.generatedDate}`, M, { font: regular, size: 9, color: GREY });
  if (si.forecastName) {
    ctx.y -= 13;
    text(ctx, `Project / Forecast Sales: ${si.forecastName}`, M, { font: regular, size: 9, color: GREY });
  }
  if (si.shipmentNumber) {
    ctx.y -= 13;
    text(ctx, `Shipment Number: ${si.shipmentNumber}`, M, { font: regular, size: 9, color: GREY });
  }
  if (si.isEarly) {
    ctx.y -= 13;
    text(ctx, "EARLY SI - Pending CEO Acknowledgement", M, { font: bold, size: 9, color: rgb(0.8, 0.2, 0.1) });
  }
  ctx.y -= 25;

  // ── Section header helper ──
  const section = (title: string) => {
    ctx.y -= 8;
    rect(ctx, M - 4, R - M + 8, 16, rgb(0.95, 0.95, 0.95));
    ctx.y += 4;
    text(ctx, title.toUpperCase(), M, { font: bold, size: 8, color: ACCENT });
    ctx.y -= 18;
  };

  const row = (label: string, value: string) => {
    text(ctx, label + ":", M, { font: bold, size: 9, color: DARK });
    text(ctx, value || "-", M + 140, { font: regular, size: 9, color: BLACK });
    ctx.y -= 14;
  };

  // ── Parties ──
  section("Parties");
  row("Buyer", si.buyer);
  row("Supplier", si.supplier);
  row("Source / Mine", si.source);

  // ── Shipment Details ──
  section("Shipment Details");
  row("Product", si.product);
  row("Quantity", `${si.quantity.toLocaleString()} MT${si.tolerance ? ` ± ${si.tolerance}` : ""}`);
  row("Port of Loading", si.pol);
  row("Port of Discharge", si.pod);
  row("Laycan", `${si.laycanStart} - ${si.laycanEnd}`);
  row("Vessel / Barge", si.vesselBarge);
  row("Contract Reference", si.contractReference);

  // ── Coal Specification ──
  section("Coal Specification");
  const specEntries = Object.entries(si.coalSpec)
    .filter(([, v]) => v !== null && v !== undefined && v !== "");
  for (const [k, v] of specEntries) {
    row(k.toUpperCase(), String(v));
  }

  // ── Required Documents ──
  if (si.documentRequired) {
    section("Required Documents");
    const lines = wrapText(si.documentRequired, 90);
    for (const l of lines) {
      text(ctx, l, M, { font: regular, size: 9 });
      ctx.y -= 14;
    }
  }

  // ── Remarks ──
  if (si.remarks) {
    section("Remarks");
    const lines = wrapText(si.remarks, 90);
    for (const l of lines) {
      text(ctx, l, M, { font: regular, size: 9 });
      ctx.y -= 14;
    }
  }

  // ── Footer ──
  ctx.y = 60;
  line(ctx, M, R);
  ctx.y -= 12;
  text(ctx, "This document is computer-generated by CoalTrade OS.", M, { font: regular, size: 8, color: GREY });
  text(ctx, `Generated: ${si.generatedDate}`, R, { font: regular, size: 8, color: GREY, align: "right" });

  return doc.save();
}

// ─── FCO PDF ─────────────────────────────────────────────────────────────────

export interface FCOData {
  fcoNumber:          string;
  version:            number;
  projectName:        string;
  buyer:              string;
  buyerCountry?:      string;
  commodity?:         string;
  quantity?:          number;
  quantityUnit?:      string;
  laycanStart?:       string;
  laycanEnd?:         string;
  pol?:               string;
  salesPrice?:        number;
  priceBasis?:        string;
  paymentTerm?:       string;
  surveyorName?:      string;
  shippingTerm?:      string;
  specGar?:           number;
  specTs?:            number;
  specAsh?:           number;
  specTm?:            number;
  generatedBy:        string;
  generatedDate:      string;
}

export async function generateFcoPdf(fco: FCOData): Promise<Uint8Array> {
  const doc   = await PDFDocument.create();
  const page  = doc.addPage([595, 842]);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, y: 800 };

  const M = 50;
  const R = width - 50;

  // ── Header ──
  rect(ctx, 0, width, 30, ACCENT);
  ctx.y += 9;
  text(ctx, "FULL CORPORATE OFFER", M, { font: bold, size: 14, color: WHITE });
  text(ctx, fco.fcoNumber, R, { font: bold, size: 10, color: WHITE, align: "right" });
  ctx.y -= 40;

  text(ctx, `FCO ${fco.fcoNumber}  |  Version: ${fco.version}  |  Date: ${fco.generatedDate}`, M, { font: regular, size: 9, color: GREY });
  ctx.y -= 20;

  text(ctx, "TO:", M, { font: bold, size: 10 });
  ctx.y -= 14;
  text(ctx, fco.buyer + (fco.buyerCountry ? `, ${fco.buyerCountry}` : ""), M, { font: regular, size: 10 });
  ctx.y -= 24;

  // Declaration
  const decl = `We, ${fco.generatedBy} ("Seller"), hereby offer to sell the below commodity under the following terms and conditions, subject to management final approval:`;
  const declLines = wrapText(decl, 88);
  for (const l of declLines) {
    text(ctx, l, M, { font: regular, size: 9 });
    ctx.y -= 13;
  }
  ctx.y -= 10;

  const section = (title: string) => {
    ctx.y -= 6;
    rect(ctx, M - 4, R - M + 8, 16, rgb(0.95, 0.95, 0.95));
    ctx.y += 4;
    text(ctx, title.toUpperCase(), M, { font: bold, size: 8, color: ACCENT });
    ctx.y -= 18;
  };

  const row = (label: string, value: string) => {
    text(ctx, label + ":", M, { font: bold, size: 9, color: DARK });
    text(ctx, value || "-", M + 150, { font: regular, size: 9 });
    ctx.y -= 14;
  };

  // ── Commodity ──
  section("Commodity & Specification");
  row("Commodity", fco.commodity ?? "Steam Coal");
  row("Origin", "Indonesia");
  if (fco.specGar)  row("GAR (kcal/kg)", `${fco.specGar} (ADB)`);
  if (fco.specTs)   row("Total Sulphur", `${fco.specTs}% max (ADB)`);
  if (fco.specAsh)  row("Ash Content",   `${fco.specAsh}% max (ADB)`);
  if (fco.specTm)   row("Total Moisture",`${fco.specTm}% max (ARB)`);

  // ── Commercial ──
  section("Commercial Terms");
  if (fco.quantity)  row("Quantity", `${fco.quantity.toLocaleString()} ${fco.quantityUnit ?? "MT"} ± 10%`);
  if (fco.laycanStart && fco.laycanEnd) row("Laycan", `${fco.laycanStart} - ${fco.laycanEnd}`);
  if (fco.pol)       row("Port of Loading", fco.pol);
  if (fco.salesPrice) row("Base Price", `USD ${fco.salesPrice.toFixed(2)} / MT ${fco.priceBasis ? `(${fco.priceBasis})` : ""}`);
  if (fco.shippingTerm) row("Shipping Terms", fco.shippingTerm);
  if (fco.paymentTerm) row("Payment Terms", fco.paymentTerm);
  if (fco.surveyorName) row("Independent Surveyor", fco.surveyorName);

  // ── Validity ──
  section("Validity & Other Terms");
  text(ctx, "This offer is valid for 3 (three) business days from the date above.", M, { font: regular, size: 9 });
  ctx.y -= 14;
  text(ctx, "All terms and conditions are subject to finalization and contract signing.", M, { font: regular, size: 9 });
  ctx.y -= 30;

  text(ctx, "Sincerely,", M, { font: regular, size: 9 });
  ctx.y -= 30;
  text(ctx, fco.generatedBy, M, { font: bold, size: 9 });
  ctx.y -= 12;
  text(ctx, "CoalTrade OS", M, { font: regular, size: 9, color: GREY });

  // ── Footer ──
  ctx.y = 60;
  line(ctx, M, R);
  ctx.y -= 12;
  text(ctx, "This FCO is computer-generated and confidential. Not for public distribution.", M, { font: regular, size: 8, color: GREY });
  text(ctx, `Generated: ${fco.generatedDate}`, R, { font: regular, size: 8, color: GREY, align: "right" });

  return doc.save();
}

// ─── Summary Report PDF ───────────────────────────────────────────────────────

export interface SummaryReportData {
  projectName:       string;
  buyer:             string;
  commodity?:        string;
  quantity?:         number;
  salesPrice?:       number;
  buyingPrice?:      number;
  laycanStart?:      string;
  laycanEnd?:        string;
  pol?:              string;
  status:            string;
  forecastMonth?:    string;
  priceBasis?:       string;
  paymentTerm?:      string;
  traders?:          string;
  specGar?:          number;
  specTs?:           number;
  specAsh?:          number;
  specTm?:           number;
  candidates: Array<{
    supplierName: string;
    origin?:      string;
    stockMt?:     number;
    priceUsd?:    number;
    selected:     boolean;
    gar?:         number;
  }>;
  roughPl?: {
    revenue?:         number;
    totalCost?:       number;
    grossProfit?:     number;
    marginPct?:       number;
  };
  approvalHistory: Array<{
    status:    string;
    comment?:  string;
    userName?: string;
    createdAt: string;
  }>;
  generatedDate: string;
  generatedBy:   string;
}

export async function generateSummaryPdf(data: SummaryReportData): Promise<Uint8Array> {
  const doc   = await PDFDocument.create();
  const page  = doc.addPage([595, 842]);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, y: 800 };

  const M = 50;
  const R = width - 50;

  // ── Header ──
  rect(ctx, 0, width, 30, ACCENT);
  ctx.y += 9;
  text(ctx, "FORECAST SALES - SUMMARY REPORT", M, { font: bold, size: 13, color: WHITE });
  ctx.y -= 38;

  text(ctx, `Project: ${data.projectName}`, M, { font: bold, size: 11 });
  ctx.y -= 14;
  text(ctx, `Buyer: ${data.buyer}  |  Status: ${data.status.toUpperCase()}  |  Generated: ${data.generatedDate}`, M, { font: regular, size: 9, color: GREY });
  ctx.y -= 22;

  const section = (title: string) => {
    ctx.y -= 6;
    rect(ctx, M - 4, R - M + 8, 16, rgb(0.95, 0.95, 0.95));
    ctx.y += 4;
    text(ctx, title.toUpperCase(), M, { font: bold, size: 8, color: ACCENT });
    ctx.y -= 18;
  };

  const row = (label: string, value: string, col2 = false) => {
    const xLabel = col2 ? M + 250 : M;
    const xVal   = col2 ? M + 400 : M + 150;
    text(ctx, label + ":", xLabel, { font: bold, size: 9, color: DARK });
    text(ctx, value || "-", xVal, { font: regular, size: 9 });
    if (!col2) ctx.y -= 13;
  };

  // ── Offer Profile ──
  section("Offer Profile");
  row("Forecast Month", data.forecastMonth ?? "-");
  row("Commodity", data.commodity ?? "-");
  if (data.quantity)   row("Quantity", `${data.quantity.toLocaleString()} MT`);
  if (data.pol)        row("Port of Loading", data.pol);
  if (data.laycanStart && data.laycanEnd) row("Laycan", `${data.laycanStart} - ${data.laycanEnd}`);
  if (data.priceBasis) row("Price Basis", data.priceBasis);
  if (data.paymentTerm) row("Payment Term", data.paymentTerm);

  // ── Spec ──
  section("Coal Specification (Requested)");
  if (data.specGar) row("GAR",          `${data.specGar} kcal/kg`);
  if (data.specTs)  row("Total Sulphur",`${data.specTs}%`);
  if (data.specAsh) row("Ash Content",  `${data.specAsh}%`);
  if (data.specTm)  row("Total Moisture",`${data.specTm}%`);

  // ── Supplier Candidates ──
  if (data.candidates.length > 0) {
    section("Supplier Candidates");
    for (const c of data.candidates) {
      const label = `${c.selected ? "[selected] " : ""}${c.supplierName}`;
      text(ctx, label, M, { font: c.selected ? bold : regular, size: 9 });
      const detail = [
        c.origin && `Origin: ${c.origin}`,
        c.stockMt && `Stock: ${c.stockMt.toLocaleString()} MT`,
        c.priceUsd && `Price: USD ${c.priceUsd}`,
        c.gar && `GAR: ${c.gar}`,
      ].filter(Boolean).join("  |  ");
      if (detail) {
        text(ctx, detail, M + 20, { font: regular, size: 8, color: GREY });
        ctx.y -= 10;
      }
      ctx.y -= 13;
    }
  }

  // ── Rough P&L ──
  if (data.roughPl && (data.roughPl.revenue || data.roughPl.grossProfit)) {
    section("Estimated P&L (Executive Restricted)");
    const pnl = data.roughPl;
    if (pnl.revenue)     row("Revenue",      `USD ${pnl.revenue.toLocaleString()}`);
    if (pnl.totalCost)   row("Total Cost",   `USD ${pnl.totalCost.toLocaleString()}`);
    if (pnl.grossProfit) row("Gross Profit", `USD ${pnl.grossProfit.toLocaleString()}`);
    if (pnl.marginPct)   row("Margin",       `${pnl.marginPct.toFixed(2)}%`);
  }

  // ── Approval History ──
  if (data.approvalHistory.length > 0) {
    section("Approval History");
    for (const h of data.approvalHistory) {
      text(ctx, `[${h.status.toUpperCase()}]`, M, { font: bold, size: 9, color: ACCENT });
      text(ctx, `${h.userName ?? "-"} on ${h.createdAt}`, M + 80, { font: regular, size: 9 });
      ctx.y -= 12;
      if (h.comment) {
        const lines = wrapText(h.comment, 85);
        for (const l of lines) {
          text(ctx, l, M + 8, { font: regular, size: 8, color: GREY });
          ctx.y -= 11;
        }
      }
    }
  }

  // ── Footer ──
  ctx.y = 60;
  line(ctx, M, R);
  ctx.y -= 12;
  text(ctx, "Generated by CoalTrade OS. This document is confidential.", M, { font: regular, size: 8, color: GREY });
  text(ctx, `By: ${data.generatedBy}  |  ${data.generatedDate}`, R, { font: regular, size: 8, color: GREY, align: "right" });

  return doc.save();
}

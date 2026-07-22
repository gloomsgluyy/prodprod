// FCO (First Coal Offer) PDF Generator
// Uses jsPDF — runs client-side, no server dependency
// Per SRS FR-FSP-004

import type { ForecastDetail } from "../hooks/use-forecasts";

export interface FCOOptions {
  project: ForecastDetail;
  companyName:    string;
  companyAddress: string;
  companyPhone:   string;
  companyEmail:   string;
  generatedBy:    string;
  fcoNumber:      string;
  version:        number;
}

// Numbers from Decimal — Prisma serialises as string or number depending on context
function n(v: unknown): string {
  const num = Number(v);
  return isNaN(num) ? "—" : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function nInt(v: unknown): string {
  const num = Number(v);
  return isNaN(num) ? "—" : num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export async function generateFCO(opts: FCOOptions): Promise<Blob> {
  // Dynamic import — keeps jspdf out of initial bundle
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { project, companyName, companyAddress, companyPhone, companyEmail, generatedBy, fcoNumber, version } = opts;

  const W   = 210; // A4 width mm
  const M   = 18;  // margin
  const NOW = new Date();

  // ── Header bar ─────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);   // dark navy
  doc.rect(0, 0, W, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FIRST COAL OFFER", M, 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`FCO No: ${fcoNumber}  |  Version: ${version}  |  Date: ${NOW.toLocaleDateString("en-GB")}`, M, 17);

  // Company name top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(companyName, W - M, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(companyAddress, W - M, 15, { align: "right" });
  doc.text(`${companyPhone}  |  ${companyEmail}`, W - M, 20, { align: "right" });

  // ── Buyer + project info block ──────────────────────────────────────────────
  let y = 32;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("OFFER DETAILS", M, y);
  y += 1;
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.line(M, y, W - M, y);
  y += 5;

  const leftCol  = M;
  const rightCol = W / 2 + 2;
  const colW     = (W - M * 2 - 4) / 2;

  function labelValue(lbl: string, val: string, x: number, yPos: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, x, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(val, x, yPos + 4);
    return yPos + 10;
  }

  const leftData: [string, string][] = [
    ["Buyer",           project.buyer],
    ["Country",         project.buyerCountry ?? "—"],
    ["Shipping Term",   project.shippingTerm ?? "—"],
    ["Port of Loading", project.pol ?? "—"],
    ["Port of Discharge", project.pod ?? "—"],
  ];

  const rightData: [string, string][] = [
    ["Project Name",    project.projectName],
    ["Segment",         (project.segment ?? "—").toUpperCase()],
    ["Quantity",        project.quantity ? `${nInt(project.quantity)} MT (${project.quantityUnit})` : "—"],
    ["Laycan Start",    project.laycanStart ? new Date(project.laycanStart).toLocaleDateString("en-GB") : "—"],
    ["Laycan End",      project.laycanEnd   ? new Date(project.laycanEnd).toLocaleDateString("en-GB")   : "—"],
  ];

  let yL = y;
  let yR = y;
  leftData.forEach(([l, v])  => { yL = labelValue(l, v, leftCol,  yL); });
  rightData.forEach(([l, v]) => { yR = labelValue(l, v, rightCol, yR); });
  y = Math.max(yL, yR) + 2;

  // ── Coal Specification ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("COAL SPECIFICATION (Typical / Rejection)", M, y);
  y += 1;
  doc.line(M, y, W - M, y);
  y += 4;

  const specRows = [
    ["Gross As Received (GAR)", "kcal/kg", project.specGar ? `${nInt(project.specGar)} kcal/kg` : "—", "— "],
    ["Total Moisture (TM)",     "% ARB",   project.specTm  ? `${n(project.specTm)}%`             : "—", "—"],
    ["Total Sulphur (TS)",      "% ARB",   project.specTs  ? `${n(project.specTs)}%`              : "—", "—"],
    ["Ash Content",             "% ARB",   project.specAsh ? `${n(project.specAsh)}%`             : "—", "—"],
  ];

  autoTable(doc, {
    startY: y,
    head:   [["Parameter", "Unit", "Typical", "Rejection"]],
    body:   specRows,
    margin: { left: M, right: M },
    styles:      { fontSize: 8, cellPadding: 2.5 },
    headStyles:  { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "striped",
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── Terms & Conditions ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("TERMS & CONDITIONS", M, y);
  y += 1;
  doc.line(M, y, W - M, y);
  y += 5;

  const tcItems = [
    "1. This offer is valid for 3 (three) business days from the date of issuance.",
    "2. Quality and quantity to be determined by a mutually agreed independent surveyor at loading port.",
    "3. Payment terms as per sales contract; default Net 30 days from Bill of Lading date.",
    "4. Force majeure clause applies as per FOSFA / GAFTA standards.",
    "5. Any dispute shall be settled by arbitration in Jakarta under BANI rules.",
    "6. Taxes and levies at origin are for Seller's account; destination taxes for Buyer's account.",
    "7. Final specifications subject to final survey — typical values may vary ±5%.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  tcItems.forEach((item) => {
    const lines = doc.splitTextToSize(item, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 4.2 + 1;
  });

  // ── Signature block ──────────────────────────────────────────────────────────
  y += 4;
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);

  const sigX1 = M;
  const sigX2 = W / 2 + 10;
  const sigW  = 60;

  doc.line(sigX1, y + 18, sigX1 + sigW, y + 18);
  doc.line(sigX2, y + 18, sigX2 + sigW, y + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorised by:", sigX1, y + 22);
  doc.text("Received / Acknowledged:", sigX2, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(generatedBy,  sigX1, y + 27);
  doc.text(companyName,  sigX1, y + 31);
  doc.text(NOW.toLocaleDateString("en-GB"), sigX1, y + 35);
  doc.text("Buyer Representative", sigX2, y + 27);
  doc.text(project.buyer, sigX2, y + 31);

  // ── Remarks ──────────────────────────────────────────────────────────────────
  if (project.remarks) {
    y += 44;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 140);
    const remarksLines = doc.splitTextToSize(`Remarks: ${project.remarks}`, W - M * 2);
    doc.text(remarksLines, M, y);
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`CONFIDENTIAL — ${companyName}  |  FCO ${fcoNumber} v${version}  |  Generated: ${NOW.toLocaleString()}  |  Page ${i} of ${pageCount}`, W / 2, 291, { align: "center" });
  }

  return doc.output("blob");
}

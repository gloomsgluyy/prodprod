// Minutes of Meeting PDF generator using jsPDF
// Called client-side — no server dependency

export interface MOMData {
  title:        string;
  scheduledAt:  string;
  location?:    string | null;
  participants: string[];
  agenda?:      string | null;
  momContent:   string;
  companyName:  string;
}

export async function generateMOMPDF(data: MOMData): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const M = 18;
  const NOW = new Date();

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("MINUTES OF MEETING", M, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.companyName, W - M, 14, { align: "right" });

  // ── Meeting meta ──────────────────────────────────────────────────────────
  let y = 30;
  doc.setTextColor(15, 23, 42);

  const metaRows = [
    ["Meeting Title", data.title],
    ["Date & Time",   new Date(data.scheduledAt).toLocaleString("en-GB")],
    ["Location",      data.location ?? "—"],
    ["Printed",       NOW.toLocaleString("en-GB")],
  ];

  doc.setFontSize(9);
  for (const [label, value] of metaRows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(value, M + 40, y);
    y += 6;
  }

  // ── Attendees ─────────────────────────────────────────────────────────────
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("ATTENDEES", M, y);
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  y += 1;
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const cols = 2;
  const colW = (W - M * 2) / cols;
  data.participants.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    doc.text(`• ${p}`, M + col * colW, y + row * 5.5);
  });
  y += Math.ceil(data.participants.length / cols) * 5.5 + 4;

  // ── Agenda ────────────────────────────────────────────────────────────────
  if (data.agenda) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AGENDA", M, y);
    y += 1;
    doc.line(M, y, W - M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const agendaLines = doc.splitTextToSize(data.agenda, W - M * 2);
    doc.text(agendaLines, M, y);
    y += agendaLines.length * 4.5 + 4;
  }

  // ── MOM Content ───────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MINUTES", M, y);
  y += 1;
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const contentLines = doc.splitTextToSize(data.momContent, W - M * 2);

  // Handle page breaks
  for (const line of contentLines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, M, y);
    y += 4.5;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${data.companyName} · MOM: ${data.title} · Generated: ${NOW.toLocaleString()} · Page ${i} of ${pageCount}`,
      W / 2, 291, { align: "center" }
    );
  }

  return doc.output("blob");
}

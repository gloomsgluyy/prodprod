const DOCUMENTS = [
  { id: "DOC-01", type: "IUP OP", name: "Izin Usaha Pertambangan Operasi Produksi", entity: "PT Tambang Maju", expiry: "2027-12-31", status: "valid" },
  { id: "DOC-02", type: "RKAB", name: "Rencana Kerja & Anggaran Biaya", entity: "PT Tambang Maju", expiry: "2026-12-31", status: "valid" },
  { id: "DOC-03", type: "ET", name: "Eksportir Terdaftar Batubara", entity: "CoalTrade Resources", expiry: "2026-08-15", status: "expiring" },
  { id: "DOC-04", type: "AMDAL", name: "Izin Lingkungan AMDAL", entity: "CV Mining Services", expiry: "2025-11-01", status: "expired" },
];

export const metadata = { title: "Compliance · CoalTrade OS" };

export default function CompliancePage() {
  const counts = { valid: DOCUMENTS.filter((d) => d.status === "valid").length, expiring: DOCUMENTS.filter((d) => d.status === "expiring").length, expired: DOCUMENTS.filter((d) => d.status === "expired").length };
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header"><h1 className="page__title text-2xl font-semibold">Legal & Compliance Hub</h1><p className="text-sm text-muted-foreground">Monitor IUP, RKAB, ET, AMDAL expiry.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Object.entries(counts).map(([k, v]) => <div key={k} className="card p-5 text-center"><p className="text-2xl font-semibold">{v}</p><p className="text-xs text-muted-foreground capitalize">{k}</p></div>)}</div>
      <section className="card overflow-hidden"><div className="p-4 border-b border-border"><h2 className="font-semibold">Active Document Register</h2></div>{DOCUMENTS.map((doc) => <div key={doc.id} className="p-4 border-b border-border last:border-0 flex flex-col sm:flex-row gap-2 sm:items-center justify-between"><div><p className="font-medium text-sm">{doc.name} <span className="badge badge--xs badge--neutral">{doc.type}</span></p><p className="text-xs text-muted-foreground">{doc.entity}</p></div><div className="sm:text-right"><span className={`badge badge--xs ${doc.status === "valid" ? "badge--success" : doc.status === "expiring" ? "badge--warning" : "badge--danger"}`}>{doc.status}</span><p className="text-xs text-muted-foreground mt-1">Expires {doc.expiry}</p></div></div>)}</section>
    </div>
  );
}

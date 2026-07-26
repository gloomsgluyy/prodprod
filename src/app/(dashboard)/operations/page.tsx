const FLEETS = [
  { id: "BG-01", type: "barge", name: "Barge Trans 01", location: "Taboneo Anchorage", status: "loading", progress: 65, eta: "2026-08-10", cargo: "4200 GAR", amount: "7,500 MT" },
  { id: "MV-05", type: "vessel", name: "MV Ocean Bulk", location: "Muara Pantai", status: "anchorage", progress: 0, eta: "2026-08-12", cargo: "5500 GAR", amount: "55,000 MT" },
  { id: "BG-03", type: "barge", name: "Barge Trans 03", location: "Jetty Kelanis", status: "sailing", progress: 100, eta: "2026-08-08", cargo: "4200 GAR", amount: "8,000 MT" },
];

const PORTS = [
  { name: "Port of Taboneo", vessels: 15, status: "normal" },
  { name: "Muara Pantai Anchorage", vessels: 28, status: "congested", warning: "Bad Weather" },
];

export const metadata = { title: "Operations · CoalTrade OS" };

export default function OperationsPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header"><h1 className="page__title text-2xl font-semibold">Vessel Operations Command</h1><p className="text-sm text-muted-foreground">Fleet logistics, loading progress, port congestion.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-4">Live Tracking Board</h2>
          <div className="space-y-3">
            {FLEETS.map((f) => (
              <div key={f.id} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div><p className="font-semibold">{f.name} <span className="badge badge--xs badge--neutral uppercase">{f.type}</span></p><p className="text-xs text-muted-foreground">{f.location} · {f.cargo}</p></div>
                <div className="flex-1 min-w-48"><div className="flex justify-between text-xs mb-1"><span className="capitalize">{f.status}</span><span>{f.progress}%</span></div><div className="h-2 bg-muted rounded"><div className="h-2 bg-primary rounded" style={{ width: `${f.progress}%` }} /></div></div>
                <div className="text-sm sm:text-right"><p className="font-medium">{f.amount}</p><p className="text-xs text-muted-foreground">ETA {f.eta}</p></div>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="card p-5"><h2 className="font-semibold mb-4">Loading Ports</h2>{PORTS.map((p) => <div key={p.name} className="rounded-lg border border-border p-3 mb-2"><div className="flex justify-between"><p className="font-medium text-sm">{p.name}</p><span className={`badge badge--xs ${p.status === "normal" ? "badge--success" : "badge--warning"}`}>{p.status}</span></div><p className="text-xs text-muted-foreground mt-1">{p.vessels} vessels {p.warning ? `· ${p.warning}` : ""}</p></div>)}</section>
          <section className="card p-5 border-danger/30"><h2 className="font-semibold text-danger mb-2">Operation Alerts</h2><p className="text-sm text-muted-foreground">High swell warning at Muara Pantai. Loading delayed 12 hours.</p></section>
        </aside>
      </div>
    </div>
  );
}

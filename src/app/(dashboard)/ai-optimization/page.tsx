import Link from "next/link";

export const metadata = { title: "AI Optimization · CoalTrade OS" };

export default function AIOptimizationPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header"><h1 className="page__title text-2xl font-semibold">Optimization & Analytics</h1><p className="text-sm text-muted-foreground">Predictive logistics, route reroute, blending margin cues.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-6 border-primary/30"><h2 className="font-semibold mb-2">Logistics Route Optimization</h2><p className="text-sm text-muted-foreground mb-4">Samarinda congestion detected. Balikpapan route estimated to reduce demurrage by USD 34,500.</p><Link href="/shipment-monitor" className="button button--primary">Review Shipments</Link></section>
        <section className="card p-6 border-success/30"><h2 className="font-semibold mb-2">Predictive Blending Margin</h2><p className="text-sm text-muted-foreground mb-4">Opportunity: 65% GAR 4400 + 35% GAR 3800 to meet GAR 4200 at lower cost.</p><Link href="/blending" className="button button--primary">Open Simulator</Link></section>
      </div>
      <section className="card p-6"><h2 className="font-semibold mb-4">Market Sentiment Insights</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><p className="font-medium text-sm">ICI Index Prediction</p><p className="text-xs text-muted-foreground">4200 GAR projected stronger next 14 days.</p></div><div><p className="font-medium text-sm">Freight Rates</p><p className="text-xs text-muted-foreground">South Kalimantan barge rates trending down.</p></div><div><p className="font-medium text-sm">Supplier Risk</p><p className="text-xs text-muted-foreground">Monitor PSI failures and external news.</p></div></div></section>
    </div>
  );
}

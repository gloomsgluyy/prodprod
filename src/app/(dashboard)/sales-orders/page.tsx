import Link from "next/link";

export const metadata = { title: "Sales Orders · CoalTrade OS" };

export default function SalesOrdersPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header"><h1 className="page__title text-2xl font-semibold">Sales Orders</h1><p className="text-sm text-muted-foreground">Legacy route restored. New flow lives in Forecast Sales and Sales Monitor.</p></div>
      <section className="card p-6"><h2 className="font-semibold mb-2">Order workflow consolidated</h2><p className="text-sm text-muted-foreground mb-4">Create demand in Forecast Sales, convert approved forecast to shipment, monitor deal status in Sales Monitor.</p><div className="flex gap-2"><Link href="/forecast-sales" className="button button--primary">Open Forecast Sales</Link><Link href="/sales-monitor" className="button button--ghost button--neutral">Open Sales Monitor</Link></div></section>
    </div>
  );
}

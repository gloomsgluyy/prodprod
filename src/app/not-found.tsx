import Link from "next/link";

export const metadata = { title: "404 Not Found · CoalTrade OS" };

export default function NotFound() {
  return (
    <main className="error-page" role="main">
      {/* Brand */}
      <Link href="/" className="error-page__brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" opacity=".45" />
          <path d="M12 2l4 2.3V12c0 2.8-1.6 5.5-4 7V2z" />
        </svg>
        CoalTrade OS
      </Link>

      {/* Illustration placeholder — Stisla "404" illustration (TODO: paste SVG) */}
      <div aria-hidden="true" className="error-page__code">404</div>

      <h1 className="error-page__title">Page Not Found</h1>
      <p className="error-page__message">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Check the URL or navigate back to the dashboard.
      </p>

      <div className="flex gap-3">
        <Link href="/" className="button button--primary">← Back to Dashboard</Link>
        <Link href="/shipment-monitor" className="button button--ghost button--neutral">Shipment Monitor</Link>
      </div>

      <p className="text-xs text-muted-foreground">
        CoalTrade OS · If this keeps happening, contact your system administrator.
      </p>
    </main>
  );
}

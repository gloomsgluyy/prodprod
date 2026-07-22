import Link from "next/link";

export const metadata = { title: "403 Forbidden · CoalTrade OS" };

export default function ForbiddenPage() {
  return (
    <main className="error-page" role="main">
      <Link href="/" className="error-page__brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" opacity=".45"/>
          <path d="M12 2l4 2.3V12c0 2.8-1.6 5.5-4 7V2z"/>
        </svg>
        CoalTrade OS
      </Link>

      <div aria-hidden="true" className="error-page__code">403</div>

      <h1 className="error-page__title">Access Denied</h1>
      <p className="error-page__message">
        You don&apos;t have permission to view this page.
        This area is restricted to specific roles.
        Contact your administrator if you believe this is a mistake.
      </p>

      <div className="flex gap-3">
        <Link href="/" className="button button--primary">← Back to Dashboard</Link>
      </div>

      <p className="text-xs text-muted-foreground">
        CoalTrade OS · Role-Based Access Control (RBAC) enforced server-side.
      </p>
    </main>
  );
}

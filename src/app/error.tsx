"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error:  Error & { digest?: string };
  reset:  () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error tracking service (e.g. Sentry) — integration TODO
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="error-page" role="alert" aria-live="assertive">
      <Link href="/" className="error-page__brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" opacity=".45" />
          <path d="M12 2l4 2.3V12c0 2.8-1.6 5.5-4 7V2z" />
        </svg>
        CoalTrade OS
      </Link>

      <div aria-hidden="true" className="error-page__code">500</div>

      <h1 className="error-page__title">Something went wrong</h1>
      <p className="error-page__message">
        An unexpected error occurred. Our team has been notified.
        You can try again or return to the dashboard.
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="font-mono text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-xl w-full overflow-x-auto">
          <p className="font-semibold mb-1">Error (dev only):</p>
          <p>{error.message}</p>
          {error.digest && <p className="text-muted-foreground mt-1">Digest: {error.digest}</p>}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" className="button button--primary" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="button button--ghost button--neutral">← Dashboard</Link>
      </div>
    </main>
  );
}

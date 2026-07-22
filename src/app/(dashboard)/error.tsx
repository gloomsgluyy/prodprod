"use client";

import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="text-6xl font-light text-muted-foreground" aria-hidden="true">⚠</div>
      <h2 className="text-2xl font-semibold text-center">Something went wrong</h2>
      <p className="text-muted-foreground text-center max-w-md">
        An error occurred in this section. You can try again or navigate to another module.
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="font-mono text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-xl w-full overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" className="button button--primary" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="button button--ghost button--neutral">← Dashboard</Link>
      </div>
    </div>
  );
}

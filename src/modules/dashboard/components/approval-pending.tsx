"use client";

import Link from "next/link";
import { useApprovalPending } from "../hooks/use-dashboard";

interface PendingProject {
  id: string;
  projectName: string;
  buyer: string;
  quantity: number | null;
  laycanStart: string | null;
  createdAt: string;
  createdBy: { name: string };
}

export function ApprovalPending() {
  const { data, isLoading } = useApprovalPending();
  const projects = (data?.data ?? []) as PendingProject[];

  if (!isLoading && projects.length === 0) return null;

  return (
    <div className="card">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-eyebrow">Waiting Approval</p>
            {projects.length > 0 && (
              <span className="badge badge--warning badge--sm">{projects.length}</span>
            )}
          </div>
          <Link href="/forecast-sales" className="link text-xs">Open Forecast Sales →</Link>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-warning/5 border border-warning/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.buyer}
                    {p.quantity && ` · ${Number(p.quantity).toLocaleString()} MT`}
                    {p.laycanStart && ` · Laycan ${new Date(p.laycanStart).toLocaleDateString()}`}
                  </p>
                </div>
                <span className="badge badge--warning badge--sm flex-shrink-0">Waiting</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface DocEntry {
  id: string; name: string; fileName: string | null; fileSize: number | null;
  fileUrl: string; group: string; source: string;
  owner: string | null; buyer: string | null; shipmentNumber: string | null;
  uploadedAt: string | null; isCritical: boolean; notes: string | null;
}

interface Summary { total: number; shipment: number; si: number; forecast: number; required: number; }

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const SOURCE_OPTIONS = ["all","Shipment","SI","Forecast"];
const GROUP_OPTIONS  = ["all","Shipment Document","SI","Forecast","Required"];

const FOLDER_TREE = [
  { key: "all",       label: "📁 All Documents", icon: "📁" },
  { key: "Shipment",  label: "📦 Shipment Docs",  icon: "📦" },
  { key: "SI",        label: "📋 Shipping Instructions", icon: "📋" },
  { key: "Forecast",  label: "📈 FCO / Forecast", icon: "📈" },
];

export default function DocumentDrivePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("all");
  const [group,  setGroup]  = useState("all");
  const [activeFolder, setActiveFolder] = useState("all");

  // Debounce search 250ms
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    clearTimeout((handleSearch as unknown as { timer?: ReturnType<typeof setTimeout> }).timer);
    (handleSearch as unknown as { timer?: ReturnType<typeof setTimeout> }).timer =
      setTimeout(() => setDebouncedSearch(value), 250);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["document-drive", debouncedSearch, source, group],
    queryFn: () => api.get<{ data: DocEntry[]; summary: Summary; meta: { total: number } }>(
      `/api/document-drive?search=${encodeURIComponent(debouncedSearch)}&source=${source}&group=${group}`
    ),
    placeholderData: (prev) => prev,
  });

  const docs    = data?.data    ?? [];
  const summary = data?.summary ?? { total:0, shipment:0, si:0, forecast:0, required:0 };

  function handleFolderClick(key: string) {
    setActiveFolder(key);
    setSource(key === "all" ? "all" : key);
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="page__header">
        <h1 className="page__title text-2xl font-semibold">
          Document Drive <span className="text-muted-foreground font-normal text-base">— Document Repository</span>
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Files",  value: summary.total,    color: "text-emerald-500" },
          { label: "Forecast",     value: summary.forecast,  color: "text-cyan-500"   },
          { label: "Shipment",     value: summary.shipment,  color: "text-blue-500"   },
          { label: "SI",           value: summary.si,        color: "text-teal-500"   },
          { label: "Required",     value: summary.required,  color: "text-violet-500" },
        ].map((c) => (
          <div key={c.label} className="card card--stat">
            <div className="card__body">
              <p className="text-eyebrow">{c.label}</p>
              <p className={`text-2xl font-light ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Folder tree */}
        <nav className="xl:col-span-1" aria-label="Document folders">
          <div className="card">
            <div className="card__body gap-1">
              <p className="text-eyebrow mb-2">Folders</p>
              {FOLDER_TREE.map((f) => (
                <button key={f.key} type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFolder===f.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-surface text-muted-foreground"}`}
                  onClick={() => handleFolderClick(f.key)}
                  aria-pressed={activeFolder===f.key}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Document list */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="input-group flex-1 min-w-48">
              <span className="input-group__text">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                  <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
                </svg>
              </span>
              <input type="search" className="input"
                placeholder="Search SI number, shipment, buyer, filename…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search documents" />
            </div>
            <select className="select select--sm w-36" value={source}
              onChange={(e) => { setSource(e.target.value); setActiveFolder(e.target.value === "all" ? "all" : e.target.value); }}
              aria-label="Filter by source">
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All Sources" : s}</option>
              ))}
            </select>
            <select className="select select--sm w-40" value={group}
              onChange={(e) => setGroup(e.target.value)}
              aria-label="Filter by group">
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>{g === "all" ? "All Groups" : g}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card__body gap-3">
              <p className="text-xs text-muted-foreground">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({length:8}).map((_,i)=><div key={i} className="h-10 bg-muted rounded"/>)}
                </div>
              ) : docs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {/* TODO: ganti dengan ilustrasi Folder dari Stisla */}
                  <p>No documents found</p>
                  {search && <p className="text-xs mt-1">Try a different search term</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table--striped text-sm" aria-label="Document drive table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Owner / Buyer</th>
                        <th>Source</th>
                        <th>Group</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <div className="flex items-start gap-2">
                              {doc.isCritical && (
                                <span className="flex-shrink-0 text-red-500 text-xs mt-0.5" title="Required document">⚠</span>
                              )}
                              <div>
                                <p className="font-medium leading-tight">{doc.name}</p>
                                {doc.fileName && (
                                  <p className="text-xs text-muted-foreground">
                                    {doc.fileName}
                                    {doc.fileSize && ` · ${formatSize(doc.fileSize)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-xs">
                            {doc.owner   && <p>{doc.owner}</p>}
                            {doc.buyer   && <p className="text-muted-foreground">{doc.buyer}</p>}
                            {doc.shipmentNumber && <p className="text-muted-foreground">{doc.shipmentNumber}</p>}
                          </td>
                          <td>
                            <span className="badge badge--neutral badge--sm">{doc.source}</span>
                          </td>
                          <td>
                            <span className="badge badge--info badge--sm">{doc.group}</span>
                          </td>
                          <td className="text-xs text-muted-foreground">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                className="button button--xs button--ghost button--primary"
                                aria-label={`Open ${doc.name}`}>
                                Open ↗
                              </a>
                              <a href={doc.fileUrl} download={doc.fileName ?? doc.name}
                                className="button button--xs button--ghost button--neutral"
                                aria-label={`Download ${doc.name}`}>
                                ↓
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

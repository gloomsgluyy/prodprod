"use client";

import { FormEvent, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { useShipmentUIStore } from "../../store/shipment-ui-store";
import {
  type ShipmentDocument,
  downloadAllDocumentsZip,
  useAddDocumentFile,
  useDeleteDocumentFile,
  useShipmentDocuments,
  useUpdateDocument,
  useUploadDocumentFile,
} from "../../hooks/use-shipments";


const STATUS_OPTS = ["pending", "received", "submitted", "completed", "not_required"] as const;

interface DocRowProps {
  doc: ShipmentDocument;
  shipmentId: string;
}

function displayNameFromUrl(value: string) {
  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "document");
  } catch {
    return value.split("/").pop() || "document";
  }
}

function DocRow({ doc, shipmentId }: DocRowProps) {
  const [expanded,    setExpanded]    = useState(false);
  const [addMode,     setAddMode]     = useState<"upload" | "url">("upload");
  // URL-add state
  const [fileUrl,     setFileUrl]     = useState("");
  const [fileTitle,   setFileTitle]   = useState("");
  const [visibility,  setVisibility]  = useState<"public" | "internal" | "critical">("internal");
  // Upload state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadVis,   setUploadVis]   = useState<"public" | "internal" | "critical">("internal");
  const [isDragging,  setIsDragging]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: update,     isPending: updating     } = useUpdateDocument(shipmentId);
  const { mutate: addFile,    isPending: addingFile    } = useAddDocumentFile(shipmentId);
  const { mutate: uploadFile, isPending: uploadingFile } = useUploadDocumentFile(shipmentId);
  const { mutate: deleteFile, isPending: deletingFile  } = useDeleteDocumentFile(shipmentId);

  const agingColor = doc.agingDays == null ? "" :
    doc.agingDays > 30 ? "text-red-500 font-semibold" :
    doc.agingDays > 15 ? "text-amber-500" : "";

  function processSelectedFile(file: File) {
    if (!file) return;
    uploadFile({
      file,
      requirementCode: doc.requirementCode,
      fileTitle: uploadTitle.trim() || file.name,
      visibility: uploadVis,
    }, {
      onSuccess: () => {
        setUploadTitle("");
        setUploadVis("internal");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  function submitUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileUrl.trim()) return;
    const trimmedUrl = fileUrl.trim();
    addFile({
      requirementCode: doc.requirementCode,
      fileUrl: trimmedUrl,
      fileName: displayNameFromUrl(trimmedUrl),
      fileTitle: fileTitle.trim() || doc.label,
      visibility,
    }, {
      onSuccess: () => { setFileUrl(""); setFileTitle(""); setVisibility("internal"); },
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  }


  return (
    <>
      <tr className={doc.status === "completed" ? "opacity-70" : ""}>
        <td className="font-mono text-xs">{doc.requirementCode.toUpperCase()}</td>
        <td className="text-sm">{doc.label}</td>
        <td>
          <select
            className="select select--sm"
            value={doc.status}
            disabled={updating}
            onChange={(e) => update({ requirementCode: doc.requirementCode, status: e.target.value as never })}
            aria-label={`Status for ${doc.label}`}
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </td>
        <td>{doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() : "-"}</td>
        <td>{doc.agingDays != null ? <span className={`text-xs ${agingColor}`}>{doc.agingDays}d</span> : "-"}</td>
        <td className="text-xs">{doc.pic ?? "-"}</td>
        <td>
          <span className="badge badge--neutral badge--sm">{doc.files?.length ?? 0} files</span>
        </td>
        <td>
          <button
            type="button"
            className="button button--xs button--ghost button--neutral button--icon-only"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse document row" : "Expand document row"}
          >
            {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-surface px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-eyebrow mb-1">Received Date</p>
                <input
                  type="date"
                  className="input input--sm"
                  defaultValue={doc.receivedDate?.split("T")[0] ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, receivedDate: e.target.value || null })}
                  aria-label="Received date"
                />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Submitted Date</p>
                <input
                  type="date"
                  className="input input--sm"
                  defaultValue={doc.submittedDate?.split("T")[0] ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, submittedDate: e.target.value || null })}
                  aria-label="Submitted date"
                />
              </div>
              <div>
                <p className="text-eyebrow mb-1">PIC</p>
                <input
                  type="text"
                  className="input input--sm"
                  defaultValue={doc.pic ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, pic: e.target.value })}
                  aria-label="PIC name"
                />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Owner</p>
                <input
                  type="text"
                  className="input input--sm"
                  defaultValue={doc.owner ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, owner: e.target.value })}
                  aria-label="Owner"
                />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Hardcopy Status</p>
                <input
                  type="text"
                  className="input input--sm"
                  defaultValue={doc.hardcopyStatus ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, hardcopyStatus: e.target.value })}
                  aria-label="Hardcopy status"
                />
              </div>
              <div>
                <p className="text-eyebrow mb-1">Submitted To</p>
                <input
                  type="text"
                  className="input input--sm"
                  defaultValue={doc.submittedTo ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, submittedTo: e.target.value })}
                  aria-label="Submitted to"
                />
              </div>
              <div className="col-span-2">
                <p className="text-eyebrow mb-1">Notes</p>
                <input
                  type="text"
                  className="input input--sm"
                  defaultValue={doc.notes ?? ""}
                  onBlur={(e) => update({ requirementCode: doc.requirementCode, notes: e.target.value })}
                  aria-label="Notes"
                />
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-eyebrow">Files</p>
                <span className="text-xs text-muted-foreground">{doc.files?.length ?? 0} attached</span>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {(doc.files ?? []).map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-3 rounded border border-border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.title ?? file.originalName ?? "Document file"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        v{file.version} | {file.visibility} | {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {file.publicUrl && (
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button--xs button--ghost button--primary button--icon-only"
                          aria-label="Open file"
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="button button--xs button--ghost button--neutral button--icon-only"
                        disabled={deletingFile}
                        onClick={() => deleteFile(file.id)}
                        aria-label="Delete file"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                {(doc.files?.length ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground">No files attached.</p>
                )}
              </div>

              {/* ── Add file: tabbed Upload / URL ── */}
              <div className="mt-3">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`button button--xs ${addMode === "upload" ? "button--primary" : "button--ghost button--neutral"}`}
                    onClick={() => setAddMode("upload")}
                  >
                    <Upload size={12} aria-hidden="true" /> Upload File
                  </button>
                  <button
                    type="button"
                    className={`button button--xs ${addMode === "url" ? "button--primary" : "button--ghost button--neutral"}`}
                    onClick={() => setAddMode("url")}
                  >
                    <Plus size={12} aria-hidden="true" /> Add URL
                  </button>
                </div>

                {addMode === "upload" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        className="input input--sm flex-1"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="Display title (optional)"
                        aria-label="Upload title"
                      />
                      <select
                        className="select select--sm"
                        value={uploadVis}
                        onChange={(e) => setUploadVis(e.target.value as "public" | "internal" | "critical")}
                        aria-label="File visibility"
                      >
                        <option value="internal">internal</option>
                        <option value="public">public</option>
                        <option value="critical">critical</option>
                      </select>
                    </div>
                    {/* ── Dropzone & File Picker ── */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !uploadingFile && fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-primary bg-primary/10 text-primary scale-[1.01]"
                          : "border-border hover:border-primary/60 hover:bg-muted/30 text-muted-foreground"
                      } ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload file drop zone"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileChange}
                        disabled={uploadingFile}
                      />

                      {uploadingFile ? (
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <span className="spinner spinner--sm" aria-hidden="true" />
                          Uploading file…
                        </div>
                      ) : (
                        <>
                          <div className="rounded-full bg-muted p-2 text-primary">
                            <Upload size={20} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {isDragging ? "Drop file here to upload" : "Drag & Drop file here or click to browse"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Supports PDF, DOCX, PNG, JPG, WEBP · Max 20 MB
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                ) : (
                  <form className="mt-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_auto] gap-2" onSubmit={submitUrl}>
                    <input
                      type="url"
                      className="input input--sm"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://..."
                      aria-label="File URL"
                    />
                    <input
                      type="text"
                      className="input input--sm"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="Display title"
                      aria-label="File title"
                    />
                    <select
                      className="select select--sm"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "public" | "internal" | "critical")}
                      aria-label="File visibility"
                    >
                      <option value="internal">internal</option>
                      <option value="public">public</option>
                      <option value="critical">critical</option>
                    </select>
                    <button type="submit" className="button button--sm button--primary" disabled={addingFile || !fileUrl.trim()}>
                      {addingFile ? <span className="spinner spinner--sm" aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                      Add
                    </button>
                  </form>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function TabDocuments() {
  const { detailId } = useShipmentUIStore();
  const { data, isLoading } = useShipmentDocuments(detailId ?? "");
  const docs = data?.data ?? [];

  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const completed  = docs.filter((d) => d.status === "completed").length;
  const critical   = docs.filter((d) => d.agingDays != null && d.agingDays > 30).length;
  const warning    = docs.filter((d) => d.agingDays != null && d.agingDays > 15 && d.agingDays <= 30).length;
  const fileCount  = docs.reduce((sum, doc) => sum + (doc.files?.length ?? 0), 0);

  async function handleDownloadZip() {
    if (!detailId) return;
    setZipping(true);
    setZipError(null);
    const err = await downloadAllDocumentsZip(detailId, detailId);
    setZipping(false);
    if (err) setZipError(err);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="badge badge--success">{completed}/{docs.length} completed</span>
          <span className="badge badge--neutral">{fileCount} files</span>
          {critical > 0 && <span className="badge badge--danger">{critical} critical aging (&gt;30d)</span>}
          {warning  > 0 && <span className="badge badge--warning">{warning} warning aging (15-30d)</span>}
        </div>
        {fileCount > 0 && (
          <button
            type="button"
            className="button button--sm button--ghost button--neutral"
            onClick={handleDownloadZip}
            disabled={zipping}
            aria-label="Download all documents as ZIP"
          >
            {zipping
              ? <><span className="spinner spinner--xs" aria-hidden="true" /> Preparing ZIP…</>
              : <><Download size={14} aria-hidden="true" /> Download All ZIP</>
            }
          </button>
        )}
      </div>
      {zipError && <p className="text-xs text-red-500">{zipError}</p>}


      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 11 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table text-sm w-full" aria-label="Document checklist">
            <thead>
              <tr>
                <th className="w-8">Code</th>
                <th>Document</th>
                <th className="w-36">Status</th>
                <th>Received</th>
                <th>Aging</th>
                <th>PIC</th>
                <th>Files</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocRow key={doc.id} doc={doc} shipmentId={detailId!} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

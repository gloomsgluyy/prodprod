"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMeetingsUIStore } from "../store/meetings-ui-store";
import {
  useMeetingList, useMeetingDetail,
  useCreateMeeting, useUpdateMeeting, useDeleteMeeting,
  useTranscribeMeeting, useExtractTasks, useConfirmTasks,
  type MeetingListItem,
} from "../hooks/use-meetings";
import { generateMOMPDF } from "../utils/mom-pdf";

const STATUS_BADGE: Record<string, string> = {
  scheduled:   "badge--neutral",
  in_progress: "badge--primary",
  completed:   "badge--success",
};

// ── Meeting form ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  title:        z.string().min(1, "Required"),
  scheduledAt:  z.string().min(1, "Required"),
  location:     z.string().optional(),
  participantsRaw: z.string().min(1, "At least one participant"),
  agenda:       z.string().optional(),
  status:       z.enum(["scheduled","in_progress","completed"]).default("scheduled"),
});
type MeetingForm = z.infer<typeof formSchema>;

function MeetingFormModal() {
  const { createModalOpen, editingId, closeCreateEdit } = useMeetingsUIStore();
  const isEdit = !!editingId;
  const { data } = useMeetingDetail(editingId ?? "");
  const detail  = data?.data;

  const { mutate: create, isPending: creating } = useCreateMeeting();
  const { mutate: update, isPending: updating } = useUpdateMeeting(editingId ?? "");
  const isPending = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MeetingForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: "scheduled" },
  });

  // Pre-fill edit
  useEffect(() => {
    if (detail && isEdit) {
      reset({
        title:       detail.title,
        scheduledAt: new Date(detail.scheduledAt).toISOString().slice(0,16),
        location:    detail.location ?? "",
        participantsRaw: detail.participants.join(", "),
        agenda:      detail.agenda ?? "",
        status:      detail.status as MeetingForm["status"],
      });
    }
  }, [detail, isEdit, reset]);

  function onSubmit(d: MeetingForm) {
    const payload = {
      ...d,
      participants: d.participantsRaw.split(",").map((s) => s.trim()).filter(Boolean),
      participantsRaw: undefined,
    };
    if (isEdit) update(payload, { onSuccess: closeCreateEdit });
    else        create(payload, { onSuccess: closeCreateEdit });
  }

  if (!createModalOpen && !isEdit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="card__body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{isEdit ? "Edit Meeting" : "Schedule Meeting"}</h2>
            <button type="button" className="button button--ghost button--neutral button--icon-only"
              onClick={closeCreateEdit} aria-label="Close">✕</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="field">
              <label className="field__label text-xs" htmlFor="mtg-title">Title *</label>
              <input id="mtg-title" type="text" className={`input ${errors.title?"input--invalid":""}`}
                placeholder="Weekly Ops Meeting" {...register("title")} />
              {errors.title && <p className="text-xs text-danger mt-0.5">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field__label text-xs" htmlFor="mtg-date">Date & Time *</label>
                <input id="mtg-date" type="datetime-local" className="input" {...register("scheduledAt")} />
              </div>
              <div className="field">
                <label className="field__label text-xs" htmlFor="mtg-loc">Location</label>
                <input id="mtg-loc" type="text" className="input" placeholder="Board Room / Zoom" {...register("location")} />
              </div>
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="mtg-participants">
                Participants * <span className="text-muted-foreground">(comma-separated)</span>
              </label>
              <input id="mtg-participants" type="text" className={`input ${errors.participantsRaw?"input--invalid":""}`}
                placeholder="Budi, Rani, Ahmad" {...register("participantsRaw")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="mtg-agenda">Agenda</label>
              <textarea id="mtg-agenda" className="input" rows={3}
                placeholder="1. Ops review&#10;2. Shipment update" {...register("agenda")} />
            </div>
            <div className="field">
              <label className="field__label text-xs" htmlFor="mtg-status">Status</label>
              <select id="mtg-status" className="select" {...register("status")}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="button button--ghost button--neutral" onClick={closeCreateEdit} disabled={isPending}>Cancel</button>
              <button type="submit" className="button button--primary" disabled={isPending} aria-busy={isPending}>
                {isPending ? <><span className="spinner spinner--sm" aria-hidden="true" /> Saving…</> : isEdit ? "Update" : "Schedule"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Meeting detail drawer ─────────────────────────────────────────────────────
function MeetingDetailDrawer() {
  const { detailId, closeDetail, openEdit } = useMeetingsUIStore();
  const { data, isLoading } = useMeetingDetail(detailId ?? "");
  const { mutate: updateMeeting } = useUpdateMeeting(detailId ?? "");
  const { mutate: transcribe, isPending: transcribing } = useTranscribeMeeting(detailId ?? "");
  const { mutate: extractTasks, isPending: extracting, data: extractResult } = useExtractTasks(detailId ?? "");
  const { mutate: confirmTasks, isPending: confirming } = useConfirmTasks(detailId ?? "");

  const meeting = data?.data;
  const [activeSection, setActiveSection] = useState<"info"|"mom"|"transcription"|"tasks"|"video">("info");
  const [momEdit, setMomEdit] = useState("");
  const [editingMom, setEditingMom] = useState(false);
  const [genPdf, setGenPdf] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!detailId) return null;

  async function downloadMOM() {
    if (!meeting) return;
    setGenPdf(true);
    try {
      const blob = await generateMOMPDF({
        title:        meeting.title,
        scheduledAt:  meeting.scheduledAt,
        location:     meeting.location,
        participants: meeting.participants,
        agenda:       meeting.agenda,
        momContent:   meeting.momContent ?? "No MOM content recorded.",
        companyName:  "CoalTrade Indonesia",
      });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href       = url;
      a.download   = `MOM_${meeting.title.replace(/\s+/g,"_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenPdf(false);
    }
  }

  function googleCalURL() {
    if (!meeting) return "#";
    const start = new Date(meeting.scheduledAt);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
    return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(meeting.title)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(meeting.location ?? "")}`;
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      transcribe(new File([new Blob(chunksRef.current, { type: "audio/webm" })], `meeting-${Date.now()}.webm`, { type: "audio/webm" }));
    };
    recorder.start();
    setRecording(true);
  }

  const SECTIONS = [
    { key: "info"         as const, label: "Info" },
    { key: "mom"          as const, label: "MOM" },
    { key: "transcription"as const, label: "Transcript" },
    { key: "tasks"        as const, label: "Tasks" },
    { key: "video"        as const, label: "Video MOM" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 w-full bg-background/50 backdrop-blur-sm"
        onClick={closeDetail} aria-label="Close drawer" tabIndex={-1} />
      <aside className="relative bg-surface w-full max-w-2xl h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="font-semibold">{meeting?.title ?? "Loading…"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {meeting ? new Date(meeting.scheduledAt).toLocaleString() : ""}
                {meeting?.location && ` · ${meeting.location}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {meeting && <span className={`badge ${STATUS_BADGE[meeting.status] ?? ""}`}>{meeting.status.replace(/_/g," ")}</span>}
              <button type="button" className="button button--ghost button--neutral button--icon-only"
                onClick={closeDetail} aria-label="Close">✕</button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button key={s.key} type="button"
                className={`button button--sm flex-shrink-0 ${activeSection===s.key?"button--primary":"button--ghost button--neutral"}`}
                onClick={() => setActiveSection(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? <div className="animate-pulse space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-muted rounded"/>)}</div>
          : meeting ? (
            <>
              {/* Info tab */}
              {activeSection === "info" && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="button button--sm button--ghost button--primary"
                      onClick={() => openEdit(meeting.id)}>Edit</button>
                    <a href={googleCalURL()} target="_blank" rel="noopener noreferrer"
                      className="button button--sm button--ghost button--neutral">+ Google Calendar</a>
                    <button type="button" className="button button--sm button--primary"
                      disabled={genPdf} onClick={downloadMOM}>
                      {genPdf ? <><span className="spinner spinner--sm" aria-hidden="true" /> Generating…</> : "Export MOM PDF"}
                    </button>
                  </div>
                  <div className="card p-4 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Participants</span>
                      <span className="font-medium">{meeting.participants.join(", ") || "—"}</span></div>
                    <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Created by</span>
                      <span className="font-medium">{meeting.createdBy.name}</span></div>
                    {meeting.agenda && (
                      <div className="py-1.5"><p className="text-muted-foreground mb-1">Agenda</p>
                        <p className="whitespace-pre-wrap">{meeting.agenda}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* MOM tab */}
              {activeSection === "mom" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    {!editingMom
                      ? <button type="button" className="button button--sm button--ghost button--primary"
                          onClick={() => { setMomEdit(meeting.momContent ?? ""); setEditingMom(true); }}>
                          {meeting.momContent ? "Edit MOM" : "Write MOM"}
                        </button>
                      : <>
                          <button type="button" className="button button--sm button--primary"
                            onClick={() => { updateMeeting({ momContent: momEdit }, { onSuccess: () => setEditingMom(false) }); }}>Save</button>
                          <button type="button" className="button button--sm button--ghost button--neutral"
                            onClick={() => setEditingMom(false)}>Cancel</button>
                        </>
                    }
                    <button type="button" className="button button--sm button--primary" disabled={genPdf} onClick={downloadMOM}>
                      {genPdf ? "Generating…" : "Export PDF"}
                    </button>
                  </div>
                  {editingMom
                    ? <textarea className="input font-mono text-sm" rows={16} value={momEdit}
                        onChange={(e) => setMomEdit(e.target.value)} aria-label="MOM content editor" />
                    : meeting.momContent
                      ? <div className="card p-4 whitespace-pre-wrap text-sm font-mono">{meeting.momContent}</div>
                      : <p className="text-muted-foreground text-sm py-4 text-center">No MOM written yet</p>
                  }
                </div>
              )}

              {/* Transcription tab */}
              {activeSection === "transcription" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <label className="button button--sm button--ghost button--neutral cursor-pointer">
                      Upload Audio
                      <input type="file" accept="audio/*,video/*" className="sr-only"
                        onChange={(e) => e.target.files?.[0] && transcribe(e.target.files[0])} />
                    </label>
                    <button type="button" className="button button--sm button--ghost button--neutral"
                      disabled={transcribing} onClick={toggleRecording}>{recording ? "Stop Recording" : "Record Audio"}</button>
                    <button type="button" className="button button--sm button--primary"
                      disabled={transcribing} aria-busy={transcribing}
                      onClick={() => transcribe(undefined)}>
                      {transcribing ? <><span className="spinner spinner--sm" aria-hidden="true" /> Transcribing…</> : "Transcribe Audio"}
                    </button>
                    <p className="text-xs text-muted-foreground self-center">Groq Whisper if configured; fallback otherwise</p>
                  </div>
                  {meeting.transcription
                    ? <div className="card p-4 whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">{meeting.transcription}</div>
                    : <p className="text-sm text-muted-foreground py-4 text-center">No transcription yet</p>
                  }
                </div>
              )}

              {/* Task extraction tab */}
              {activeSection === "tasks" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <button type="button" className="button button--sm button--primary"
                      disabled={extracting} aria-busy={extracting}
                      onClick={() => extractTasks()}>
                      {extracting ? <><span className="spinner spinner--sm" aria-hidden="true" /> Extracting…</> : "Extract Tasks from MOM"}
                    </button>
                    <p className="text-xs text-muted-foreground">AI if configured; fallback otherwise</p>
                  </div>
                  {meeting.taskExtractionStatus === "confirmed" && (
                    <p className="text-sm text-emerald-600">✓ Tasks confirmed and created</p>
                  )}
                  {(extractResult?.data?.tasks ?? meeting.extractedTasks as unknown[])?.length > 0 && meeting.taskExtractionStatus !== "confirmed" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">Review extracted tasks before confirming:</p>
                      {((extractResult?.data?.tasks ?? meeting.extractedTasks) as {title:string;assigneeHint:string;priority:string;dueDate?:string}[]).map((t, i) => (
                        <div key={i} className="card p-3 text-sm flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Assignee: {t.assigneeHint} · Priority: {t.priority}
                              {t.dueDate && ` · Due: ${new Date(t.dueDate).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="button button--primary button--sm self-start"
                        disabled={confirming} aria-busy={confirming}
                        onClick={() => confirmTasks(extractResult?.data?.tasks ?? meeting.extractedTasks ?? [])}>
                        {confirming ? <><span className="spinner spinner--sm" aria-hidden="true" /> Creating…</> : "Confirm & Create Tasks"}
                      </button>
                    </div>
                  )}
                  {!extractResult && !meeting.extractedTasks && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tasks extracted yet</p>
                  )}
                </div>
              )}

              {activeSection === "video" && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    Video MOM is a transcription handoff. Configure the Flask MOM processor for full video-to-MOM automation; upload currently stores the file and runs the existing transcription flow.
                  </div>
                  <label className="button button--primary w-fit cursor-pointer">
                    {transcribing ? <><span className="spinner spinner--sm" aria-hidden="true" /> Uploading…</> : "Upload Video for Transcription"}
                    <input type="file" accept="video/*" className="sr-only" disabled={transcribing}
                      onChange={(e) => e.target.files?.[0] && transcribe(e.target.files[0])} />
                  </label>
                  <p className="text-xs text-muted-foreground">Supported processing depends on the configured transcription provider and file size limits.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function MeetingsClient() {
  const { filterStatus, filterSearch, page, detailId, createModalOpen, editingId, confirmDeleteId,
    setFilterStatus, setFilterSearch, setPage, openDetail, openCreate, setConfirmDelete } = useMeetingsUIStore();

  const { data, isLoading } = useMeetingList({
    page, status: filterStatus === "all" ? undefined : filterStatus, search: filterSearch || undefined,
  });
  const items = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {(["all","scheduled","in_progress","completed"] as const).map((s) => (
            <button key={s} type="button"
              className={`button button--sm ${filterStatus===s?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setFilterStatus(s)} aria-pressed={filterStatus===s}>
              {s==="all"?"All":s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11.5" cy="11.5" r="9.5"/><path strokeLinecap="round" d="M18.5 18.5L22 22"/></g>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Search title, location…"
            value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} aria-label="Search meetings" />
        </div>
        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>+ Schedule Meeting</button>
      </div>

      {/* Meeting cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({length:6}).map((_,i)=><div key={i} className="card h-40"/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="card"><div className="card__body py-12 text-center text-muted-foreground">
          No meetings found
        </div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m: MeetingListItem) => (
            <button key={m.id} type="button"
              className="card text-left hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openDetail(m.id)}
              aria-label={`Open ${m.title}`}>
              <div className="card__body gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm line-clamp-2">{m.title}</p>
                  <span className={`badge badge--sm flex-shrink-0 ${STATUS_BADGE[m.status]??""}`}>
                    {m.status.replace(/_/g," ")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>📅 {new Date(m.scheduledAt).toLocaleString()}</p>
                  {m.location && <p>📍 {m.location}</p>}
                  <p>👥 {m.participants.length} participant{m.participants.length !== 1 ? "s" : ""}</p>
                </div>
                {m.taskExtractionStatus === "confirmed" && (
                  <span className="badge badge--success badge--sm">Tasks extracted</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{meta.total} meetings · Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-1">
            <button type="button" className="button button--sm button--ghost button--neutral"
              disabled={meta.page<=1} onClick={()=>setPage(meta.page-1)}>←</button>
            <button type="button" className="button button--sm button--ghost button--neutral"
              disabled={meta.page>=meta.totalPages} onClick={()=>setPage(meta.page+1)}>→</button>
          </div>
        </div>
      )}

      {/* Overlays */}
      {(createModalOpen || editingId) && <MeetingFormModal />}
      {detailId && <MeetingDetailDrawer />}
    </div>
  );
}

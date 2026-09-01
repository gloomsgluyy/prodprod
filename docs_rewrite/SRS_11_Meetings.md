# SRS Modul 11: Meetings & MOM

**Modul:** Meeting dan MOM | **Route:** `/meetings` | **Versi:** 2.1
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Partial — Video MOM upload handoff exists; Flask/provider-backed video processing remains pending.

---

## 1. Overview
Manajemen meeting terintegrasi dengan AI untuk transcription, MOM generation, dan task extraction. Mendukung audio recording, video upload, dan PDF Minutes of Meeting. Meeting bisa di-link ke project/shipment sehingga action points dari rapat langsung terhubung ke konteks operasional.

| Store | `commercial-store`, `task-store` | Dependencies | Groq AI, jsPDF, Video MOM API |
| Akses | Semua role |

---

## 2. Functional Requirements

### FR-MTG-001: Meeting CRUD (Status: Done)
Meeting list/cards. Per meeting: Title, Date, Time, Location, Attendees count, Status (scheduled/in_progress/completed).

### FR-MTG-002: Meeting Detail Panel (Status: Done)
Sub-sections: Info, Attendees, Notes/MOM, Audio Transcription, Video MOM, Task Extraction, PDF Export, Google Calendar.

### FR-MTG-003: Audio Transcription (Status: Pending — endpoint exists but Groq integration is stub; no real transcription without GROQ_API_KEY)
- "Start Recording" → rekam audio live
- "Upload Audio" → upload file
- "Transcribe" → AI transcription (Groq)

### FR-MTG-004: Video MOM Processing (Status: Done — pipeline scaffolded; Groq transcription is stub)
Upload video → auto pipeline: Extract audio → Transcribe → Generate MOM → PDF.
Progress bar per stage.

### FR-MTG-005: AI Task Extraction (Status: Pending — endpoint exists (POST+PUT) but extraction is stub; Groq key needed for real AI extraction)
"Extract Tasks from MOM" → AI extracts: title, assignee_hint, due_date, priority.
"Confirm and Create Task" → create task di task-store dengan `linkedModule` dan `linkedEntityId` otomatis terisi dari meeting context.

### FR-MTG-006: PDF Export (jsPDF) (Status: Done)
Generate MOM PDF.

### FR-MTG-007: Google Calendar Integration (Status: Done)
"Add to Calendar" → buka Google Calendar URL.

### FR-MTG-008: Add/Edit Form (Status: Done — base fields; linkedShipment/linkedProject fields pending FR-MTG-009)
Fields: Title, Date, Time, Location, Agenda, Attendees, **Linked Shipment** (optional), **Linked Project/Forecast Sales** (optional).

---

### FR-MTG-009: Link to Shipment / Project (Status: Done — linkedShipmentId/linkedProjectId added to create/update schema)
**Priority:** High

Meeting bisa di-link ke satu shipment atau satu project (Forecast Sales) untuk memberikan konteks operasional pada MOM dan action points.

**Link Fields:**

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| linkedShipmentId | FK (Shipment) | Optional | Pilih dari dropdown shipment aktif |
| linkedProjectId | FK (ForecastSales) | Optional | Pilih dari dropdown project |
| linkedContext | String | Computed | Label display: "SH-2026-042" atau "Project ABC" |

**Business Rules:**
- `BR-MTG-001`: Meeting bisa link ke shipment **atau** project — tidak wajib keduanya
- `BR-MTG-002`: Jika linked ke shipment, link "Open Shipment →" tersedia di detail panel
- `BR-MTG-003`: Jika linked ke project, link "Open Forecast Sales →" tersedia di detail panel
- `BR-MTG-004`: Task yang di-create dari meeting ini otomatis inherit `linkedShipmentId` / `linkedProjectId`
- `BR-MTG-005`: Meeting dengan link aktif tampil di Shipment Monitor sub-tab Issues sebagai referensi (read-only badge)

**Acceptance Criteria:**
- `AC-MTG-001`: Dropdown linked shipment menampilkan shipment dengan status upcoming/loading/in_transit
- `AC-MTG-002`: Dropdown linked project menampilkan project dengan status approved/ongoing
- `AC-MTG-003`: Task hasil extraction dari meeting linked menampilkan context badge ("Re: SH-2026-042")
- `AC-MTG-004`: "Open Shipment →" / "Open Forecast Sales →" link tampil di meeting detail jika ada link

---

### FR-MTG-010: Action Points Tracking (Status: Done — /api/meetings/:id/action-points GET/POST/PATCH)
**Priority:** High

Action points dari MOM dapat di-track langsung di meeting tanpa harus membuka Tasks module terpisah.

**Action Point Fields:**

| Field | Type | Required |
|-------|------|----------|
| description | String | Yes |
| pic | String (atau FK User) | Yes |
| dueDate | Date | Yes |
| status | Enum (open/in_progress/done) | Yes |
| linkedTaskId | FK (Task) | Optional — auto-link jika di-confirm ke Tasks |

**Business Rules:**
- `BR-MTG-006`: Action point bisa di-track di dalam meeting (inline) tanpa create Task
- `BR-MTG-007`: Jika "Promote to Task" diklik, action point membuat Task baru dan menyimpan `linkedTaskId`
- `BR-MTG-008`: Action point overdue (dueDate lewat + status bukan done) tampil dengan badge merah

**Acceptance Criteria:**
- `AC-MTG-005`: User bisa add action point langsung dari meeting detail tanpa navigasi ke Tasks
- `AC-MTG-006`: "Promote to Task" membuat Task dan menyimpan referensi dua arah
- `AC-MTG-007`: Overdue action points tampil di Dashboard Priority Tasks widget jika sudah di-promote ke Task

---

## 3. Data Model
### Entity: Meeting
| Field | Type | Keterangan |
|-------|------|------------|
| id | UUID | |
| title | String | |
| date | Date | |
| time | String | |
| location | String | |
| agenda | Text | |
| attendees | JSON | |
| status | Enum (scheduled/in_progress/completed) | |
| momContent | Text | |
| audioUrl | String | |
| videoUrl | String | |
| transcription | Text | |
| extractedTasks | JSON | Array task yang di-extract AI |
| taskExtractionStatus | Enum | pending/confirmed |
| **linkedShipmentId** | FK (Shipment) | Optional |
| **linkedProjectId** | FK (ForecastSales) | Optional |
| **actionPoints** | JSON | Array: {description, pic, dueDate, status, linkedTaskId} |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/meetings` |
| GET/PUT/DELETE | `/api/meetings/:id` |
| POST | `/api/meetings/:id/transcribe` |
| POST | `/api/meetings/:id/video-mom` |
| POST | `/api/meetings/:id/extract-tasks` |
| PUT | `/api/meetings/:id/extract-tasks` (confirm → create tasks) |
| GET | `/api/meetings/:id/mom-pdf` |
| **PATCH** | **`/api/meetings/:id/action-points`** (add/update action points) |

## 5. Integration Points
| Modul | Hubungan |
|-------|----------|
| Tasks | Task created from MOM extraction; action points promoted to Task |
| Dashboard | Upcoming Meetings widget |
| AI Agent | Groq AI for transcription |
| **Shipment Monitor** | **Meeting linked ke shipment → badge di Issues sub-tab; task inherit context** |
| **Forecast Sales** | **Meeting linked ke project → badge di project detail; task inherit context** |

---

*End of SRS_11_Meetings — v2.1*

# Modul: Meeting dan MOM

**Route:** `/meetings`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/meetings/page.tsx) (1047 baris, 70KB)  
**Store:** `commercial-store`, `task-store`  
**Akses:** Semua role  
**Dependencies:** AIAgent (Groq), jsPDF, Video MOM API

---

## Deskripsi Umum

Modul manajemen meeting yang terintegrasi dengan **AI untuk transcription, MOM generation, dan task extraction**. Mendukung audio recording, video upload, dan auto-generation PDF Minutes of Meeting.

---

## Layout

### 1. Header
- Title: "Meetings"
- Tombol "New Meeting"

### 2. Search dan Filter
- Search bar
- Filter status (scheduled/in_progress/completed)

### 3. Meeting Cards/List
Per meeting:

| Field | Detail |
|-------|--------|
| Title | Judul meeting |
| Date | Tanggal |
| Time | Jam |
| Location | Lokasi |
| Attendees | Jumlah peserta |
| Status | scheduled / in_progress / completed |

### 4. Meeting Detail Panel (Saat Diklik)

#### 4a. Info
- Title, Date, Time, Location, Agenda

#### 4b. Attendees
- Daftar peserta

#### 4c. Notes/MOM
- Rich text markdown content
- Hasil MOM yang di-generate

#### 4d. Audio Transcription
- Tombol "Start Recording" → rekam audio
- Tombol "Upload Audio" → upload file audio
- Tombol "Transcribe" → AI transcription (Groq)

#### 4e. Video MOM Processing
- Upload video meeting → auto-pipeline (extract audio → transcribe → MOM → PDF)
- Progress bar di setiap stage

#### 4f. AI Task Extraction
- Tombol "Extract Tasks from MOM" → AI mengekstrak action items
- Hasil: daftar extracted tasks (title, assignee_hint, due_date, priority)
- Tombol "Confirm and Create Task" per task → buat task di task-store

#### 4g. PDF Export
- Generate MOM PDF via jsPDF

#### 4h. Google Calendar
- Link "Add to Calendar" → buka URL Google Calendar

### 5. Add/Edit Form
- Title, Date, Time, Location, Agenda, Attendees

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "New Meeting" | Buat meeting baru |
| Edit | Edit meeting |
| "Record" | Mulai rekam audio |
| "Upload Audio" | Upload file audio |
| "Upload Video" | Upload file video |
| "Transcribe" | AI transcription |
| "Generate MOM" | AI MOM generation |
| "Extract Tasks" | AI task extraction dari MOM |
| "Confirm Task" | Buat task dari extracted task |
| "Download PDF" | Export MOM ke PDF |
| "Add to Calendar" | Buka Google Calendar |

---

## User Flow

```
User buka /meetings
  │
  ├── "New Meeting" → isi form → save
  │
  ├── Klik meeting → Detail Panel
  │     │
  │     ├── [Recording Flow]
  │     │     ├── "Start Recording" → rekam audio live
  │     │     └── "Upload Audio" → upload file
  │     │           └── "Transcribe" → AI transcription
  │     │
  │     ├── [Video MOM Flow]
  │     │     └── "Upload Video" → auto pipeline
  │     │           └── Extract → Transcribe → MOM → PDF
  │     │
  │     ├── [Task Extraction]
  │     │     ├── "Extract Tasks" → AI analysis
  │     │     └── Per task: "Confirm" → create di task-store
  │     │
  │     ├── "Download PDF" → jsPDF export
  │     │
  │     └── "Add to Calendar" → Google Calendar
  │
  └── Dashboard menampilkan Upcoming Meetings widget
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| All Tasks / My Tasks | Task yang di-create dari MOM extraction |
| Dashboard | Upcoming Meetings widget |
| AI Agent | Groq AI untuk transcription dan task extraction |

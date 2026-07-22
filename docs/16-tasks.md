# Modul: Tasks (All Tasks & My Tasks)

**Routes:** `/all-tasks` dan `/my-tasks`  
**File:** `src/app/all-tasks/page.tsx` dan `src/app/my-tasks/page.tsx`  
**Store:** `task-store`  
**Library:** `@hello-pangea/dnd` (Drag and Drop)

---

## Deskripsi Umum

Sistem manajemen tugas berorientasi Kanban (Board) untuk mengelola daftar pekerjaan tim. Terdiri dari dua halaman: **All Tasks** (eksekutif melihat semua tugas) dan **My Tasks** (user melihat tugas milik sendiri).

---

## Layout

### 1. Header & Controls
- Title: "All Tasks" / "My Tasks"
- Tombol **Add Task** (Icon Plus)

### 2. Summary Cards (Grid Atas)
Menampilkan jumlah (count) dari masing-masing status tugas:
- Total Tasks
- Todo
- In Progress
- Review
- Done

### 3. Kanban Board (4 Kolom Status)
Area board menggunakan Drag-and-Drop context:
- Kolom 1: **Todo** (Abu-abu)
- Kolom 2: **In Progress** (Biru)
- Kolom 3: **Review** (Kuning/Amber)
- Kolom 4: **Done** (Hijau)

### 4. Task Cards
Di dalam setiap kolom, tugas ditampilkan berupa kartu yang dapat di-drag. Isi kartu:
- **Title**: Judul pekerjaan
- **Assignee**: Nama / Inisial penanggung jawab
- **Due Date**: Tenggat waktu
- **Priority Badge**: Urgent (Merah), High (Orange), Medium (Kuning), Low (Hijau)

### 5. Interactive Dialog: Task Details & Comments
Saat Task Card diklik, modal (dialog) akan terbuka di tengah layar:
- Menampilkan deskripsi lengkap tugas.
- **WhatsApp Reminder**: Terdapat tombol untuk langsung membuka URL `wa.me` mengirim pesan reminder ke *assignee*.
- **Comments Section**: Log diskusi atau update status tugas.

### 6. Interactive Dialog: Add / Edit Task
| Field | Jenis |
|-------|-------|
| Title | Text Input |
| Description | Text Area |
| Assignee | Dropdown (List Users) |
| Priority | Dropdown |
| Due Date | Date Picker |

---

## Daftar Tombol dan Aksi

| Tombol / Interaksi | Aksi |
|--------------------|------|
| **Drag & Drop** | Mengubah status task (misal: menarik card dari *Todo* ke *In Progress*) otomatis menyimpan status baru ke database |
| **Add Task** | Membuka form dialog pembuatan tugas baru |
| **Task Card (Click)**| Membuka panel detail tugas untuk melihat deskripsi dan komentar |
| **Send WA Reminder** | Buka tab baru ke WhatsApp Web dengan pesan template *"Reminder deadline task..."* |

---

## User Flow

```
User buka /my-tasks
  │
  ├── Lihat ringkasan (contoh: 2 Todo, 1 In Progress)
  │
  ├── User klik "Add Task"
  │     └── Dialog Add terbuka → User mengisi form → Task muncul di kolom Todo
  │
  ├── User menarik (drag) Task Card ke kolom "In Progress"
  │     └── Status otomatis berubah
  │
  └── Jika task mendesak, user klik card tersebut
        └── Dialog detail terbuka → User klik "Send WA Reminder" ke staf yang bertugas.
```

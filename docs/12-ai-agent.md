# Modul: AI Excel Agent

**Route:** `/ai-agent`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/ai-agent/page.tsx) (165 baris, 7KB)  
**API:** `/api/ai-agent/excel-context`

---

## Deskripsi Umum

Agent AI yang bisa menjawab pertanyaan tentang data Excel. Sistem otomatis mem-parse file Excel di project, membangun context (workbooks, sheets, headers, rows), lalu user bisa bertanya dalam bahasa natural.

---

## Layout

### 1. Header
- Title: "AI Excel Context Agent" dengan icon Brain
- Subtitle: "Workbook-aware assistant for shipment, delivery, market, dan migration Excel context"

### 2. Summary Cards (Grid 3)

| Card | Data |
|------|------|
| Files | Jumlah workbook terdeteksi |
| Sheets | Total sheet terdeteksi |
| Rows | Total baris (formatted) |

### 3. Split Layout (Grid 1:4)

**Panel Kiri (2/5) — Excel Context Index:**
- Icon Database + "Excel Context Index"
- Per workbook:
  - File name, relative path
  - Per sheet: name, rows, columns, headers list

**Panel Kanan (3/5) — Chat Interface:**
- Input pertanyaan: placeholder "Ask about your Excel data..."
- Tombol "Send" (icon Send)
- Loading indicator saat proses
- Answer display: hasil jawaban AI (Markdown format)

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "Send" | Mengirim POST request ke `/api/ai-agent/excel-context` dengan pertanyaan user |

---

## User Flow

```
User buka /ai-agent
  │
  ├── Sistem otomatis memanggil (GET /api/ai-agent/excel-context)
  │     └── Server mem-parse semua Excel files di backend
  │     └── Tampilkan context (file, header, row count) di panel kiri
  │
  ├── User mengetik pertanyaan di chat interface
  │     └── Klik "Send" → POST request ke AI (Groq)
  │     └── AI menganalisa data spreadsheet dan memberikan jawaban
  │
  └── Contoh pertanyaan:
        ├── "Berapa total shipment bulan ini?"
        ├── "Siapa buyer terbesar di sheet Shipment?"
        └── "Apa status daily delivery terakhir?"
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| File System | Secara langsung membaca file `MV_Barge` dan `Daily_Delivery` Excel di backend |

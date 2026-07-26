# Hasil Audit Gap Parity Codebase: 11GAWE vs Rewrite

Dokumen ini memetakan seluruh perbedaan logika bisnis, field, layout, upload, menu, dan API endpoints antara codebase asli (`11GAWE`) dan codebase hasil rewrite (`CoalTrade-Production`).

---

## 1. Modul / Halaman yang Hilang (Omitted Routes)
Halaman-halaman berikut ada dan aktif pada system awal (`11GAWE`) tetapi tidak dibuat atau diabaikan dalam rewrite:

### A. Vessel Operations Command (`/operations`)
*   **Logika di 11GAWE:** Dashboard visual untuk memantau status muatan armada (barge, vessel) secara live. Menampilkan progress bar muatan berdasarkan `quantity_loaded` / `qty_plan`, lokasi koordinat jangkar (Taboneo, Muara Pantai, Kelanis Jetty), status operasional (loading, anchorage, sailing), volume cargo, ETA, delay status pelabuhan, warning cuaca buruk (swell warning delay), dan alert operasional.
*   **Logika di Rewrite:** Tidak diimplementasikan sama sekali. Link menu dilewati karena target routing tidak ada.

### B. Legal & Compliance Hub (`/compliance`)
*   **Logika di 11GAWE:** Registrasi dokumen perizinan penting perusahaan pertambangan dan pelayaran (IUP OP, RKAB tahunan, Eksportir Terdaftar (ET) Batubara, AMDAL). Sistem menghitung sisa masa berlaku otomatis (`daysUntil`), mengirim alert warning bila jatuh tempo dalam 30 hari, dan mengubah warna status dokumen (valid = hijau, expiring = kuning, expired = merah).
*   **Logika di Rewrite:** Diabaikan sepenuhnya. Tidak ada schema database pendukung dan UI hub compliance.

### C. Logistics Route Optimization (`/ai-optimization`)
*   **Logika di 11GAWE:** Dashboard Copilot analitik prediktif untuk merekomendasikan rute alternatif kapal berdasarkan cuaca dan antrean pelabuhan (contoh: pemindahan bongkar muat dari Samarinda yang kongesti tinggi ke Balikpapan yang lancar untuk menghemat demurrage sebesar USD 34,500). Menyediakan form add custom route request dan tombol "Send to Simulator" untuk diteruskan ke blending simulator.
*   **Logika di Rewrite:** Dihapus sepenuhnya.

### D. Sales Orders (`/sales-orders`)
*   **Logika di 11GAWE:** Modul manajemen sales order independen. Mempunyai schema, store, upload invoice, integrasi WhatsApp notification invoice, dan flow approval berjenjang oleh direksi.
*   **Logika di Rewrite:** Schema dihapus sepenuhnya dari database. Logika order komersial dipaksa menyatu dengan `ForecastProject` dan `Shipment`, membuat menu sales order hilang.

---

## 2. Fitur AI & Otomatisasi Core yang Berstatus Stub (Mock / Pending AI)
Beberapa fitur AI kritis di 11GAWE telah digantikan oleh data statis / mock stub di rewrite:

### A. Meeting Audio Transcription & AI Task Extraction (`/meetings`)
*   **Logika di 11GAWE:**
    *   **Live Audio Recording:** Merekam suara rapat langsung dari browser menggunakan `MediaRecorder` API dan memprosesnya secara asinkron.
    *   **Audio/Video MOM Service:** Mengirim file audio/video rapat ke Flask MOM processor server (`http://localhost:8080/api/v1`) untuk melakukan ekstraksi audio, transkripsi teks (Whisper), pembuatan MOM, serta PDF report generator secara berkala dengan job tracking.
    *   **AI Task Extraction:** Menganalisis transkrip rapat menggunakan LLM OpenRouter/Groq (`llama-3.3-70b-versatile`), mengidentifikasi tugas, orang bertanggung jawab (`assignee_hint`), due date (`due_date_hint`), dan tingkat prioritas untuk dikonfirmasi user sebelum diinsert otomatis ke modul `Tasks`.
*   **Logika di Rewrite:**
    *   Fungsi rekam suara dihapus dari UI.
    *   Fungsi transkripsi dan ekstraksi tugas diubah menjadi server-side API stub statis (`[AI Transcription Stub - Groq Whisper integration pending]`). Output selalu berupa teks template hardcoded yang sama.

### B. Partner AI Due Diligence & News Extractor (`/directory`)
*   **Logika di 11GAWE:**
    *   Mengekstraksi berita eksternal terkait partner secara dinamis menggunakan API news extractor dengan query custom (nama partner + kasus hukum/dispute/sancti/fraud).
    *   Menghitung score risiko legalitas secara deterministik berdasarkan ada tidaknya Tax ID/NPWP, expiry date dokumen legalitas, status internal partner, dan histori delay shipment terkait.
    *   Menggabungkan data internal dan berita eksternal menjadi prompt prompt komprehensif ke LLM Groq (`llama-3.3-70b-versatile`) untuk memproduksi laporan risiko, level kelayakan (LOW/MEDIUM/HIGH/CRITICAL), rekomendasi tindakan pembekuan transaksi, dan checklist verifikasi. Laporan disimpan dalam bentuk JSON terstruktur di DB.
*   **Logika di Rewrite:**
    *   Due diligence diubah menjadi API stub statis yang selalu merespon status risiko "Low" dengan score 82 secara hardcoded tanpa ada fetch berita eksternal maupun analisis LLM.

### C. Expense Receipt OCR & Anomaly Analysis (`/purchase-requests`)
*   **Logika di 11GAWE:**
    *   **Receipt OCR:** Upload bukti kuitansi dikirim ke OpenRouter Multimodal Vision model (`meta-llama/llama-4-scout-17b-16e-instruct`) untuk mengekstrak nominal uang (dengan normalisasi otomatis titik/koma ribuan rupiah Indonesia), merchant, kategori, deskripsi, dan tanggal kuitansi.
    *   **Anomaly Detection:** Sistem mendeteksi otomatis pengeluaran janggal (is_anomaly) berdasarkan historical trends pengeluaran sejenis dan memicu tanda bahaya merah (flagged anomaly).
*   **Logika di Rewrite:**
    *   Fitur OCR receipt dihilangkan dari form upload kuitansi.
    *   Kolom anomaly check, deskripsi anomaly, dan data OCR confidence dihapus sepenuhnya dari model database dan UI expenses.

---

## 3. Gap Logika Upload & Alur Kerja Form (Form & Upload Workflow)

### A. Upload Bukti Outstanding Payment Langsung di Modal Form
*   **Logika di 11GAWE:** Form modal tambah/edit pembayaran outstanding (DP & Advance) mengizinkan user meng-upload file Invoice dan Payment Proof secara langsung. Ketika form disimpan, file di-upload otomatis ke endpoint `/api/shipments/${shipmentId}/documents` dan ID dokumennya langsung ditautkan secara transparan ke payment record bersangkutan.
*   **Logika di Rewrite:** Input file upload dihilangkan dari form modal outstanding payment. User dipaksa membuka modul Shipment Monitor terlebih dahulu, mencari dokumen terkait secara manual, meng-upload-nya di sana, dan menyalin referensinya. Ini merupakan penurunan efisiensi UX yang signifikan untuk tim finance.

### B. UI Sourcing Supplier Candidate di Forecast Sales
*   **Logika di 11GAWE:** Form input Forecast Sales memuat panel pencarian supplier candidate aktif (diambil dari database `Sources`). User dapat mengklik source untuk menghitung score kecocokan spesifikasi batubara secara live (fitScore 0-100%). Apabila fitScore di bawah 80%, sistem mewajibkan pengisian `below_spec_reason` (Below-spec acknowledgement) di form sebelum data dapat diajukan ke direksi.
*   **Logika di Rewrite:**
    *   UI untuk menambah, mengedit, atau menghitung fit score supplier candidate secara interaktif di form modal tidak tersedia (hanya tersimpan stubs statis di detail drawer).
    *   Meskipun server-side API submit sekarang memblokir forecast tanpa acknowledgement, tidak ada kolom input di UI untuk mengisi alasan below-spec tersebut pada fase draf.

### C. Integrasi Document Handover / Timelines Dokumen Domestik
*   **Logika di 11GAWE:** Shipment Monitor mendukung upload terperinci untuk bukti serah terima dokumen domestik (SKAB, DSR, Surat Kirim Barang, COA POL, COA POD) dengan data tracking tanggal terbit asli, status hardcopy/softcopy, PIC penanggung jawab, serta integrasi sync otomatis ke folder drive publik (`Domestic / daily_delivery`).
*   **Logika di Rewrite:** Schema database rewrite hanya menyisakan tabel log logistik sederhana (`DailyDeliveryLog`) tanpa relasi file dokumen (`DailyDeliveryDocument` dihilangkan). Akibatnya, UI handover domestik hanya menampilkan status teks biasa tanpa bukti file upload yang dapat diakses publik via Document Drive.

---

## 4. Perbedaan Layout, Field & Database Schema

### A. Fitur Auto-Scraping Background Task
*   **Logika di 11GAWE:** File `GlobalMarketScraper.tsx` diinjeksi di root layout, memantau berkala interval update market price via `localStorage` (contoh: setiap 6 jam), dan mengirim request scrap otomatis di background secara transparan tanpa intervensi user.
*   **Logika di Rewrite:** Komponen background task dihilangkan dari layout. Auto-scraping menjadi stub pasif.

### B. Perbedaan Metadata Field pada Menu-Menu Utama
Berikut adalah field yang ada pada system awal tetapi diabaikan di rewrite UI/Schema:

| Modul | Field di 11GAWE (Web 1) | Kondisi di Rewrite (Web 2) |
| :--- | :--- | :--- |
| **Forecast Project** | `templateType` (export/domestic/spot), `templateChecklist` (checkbox task list), `blendingScenario` (simulasi blending terikat ke proyek) | Dihapus sepenuhnya dari schema database |
| **Directory Partner** | `dueDiligenceScore` (int), `dueDiligenceLevel` (text), `dueDiligenceReport` (JSON report), `lastDueDiligenceAt` (date) | Menggunakan field custom bertipe JSON/stub parsial |
| **Expense / PR** | `is_anomaly` (boolean), `anomaly_reason` (text), `ocr_data` (JSON confidence match) | Dihapus sepenuhnya dari schema database |
| **Daily Delivery** | `DailyDeliveryDocument` (tabel relasi file upload bukti serah terima SKAB/DSR) | Dihapus sepenuhnya dari schema database |

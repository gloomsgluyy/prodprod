# QA TESTING CHECKLIST - CoalTrade OS Rewrite
**Version:** 2.0 (User Experience Focus)  
**Last Updated:** 2026-07-26  
**Focus:** Kemudahan penggunaan dan efektivitas sistem

---

## CARA MENGGUNAKAN CHECKLIST INI

Checklist ini dibuat untuk **pengguna bisnis** (bukan programmer), fokus pada:
- ✅ Apakah fitur mudah digunakan?
- ✅ Apakah alur kerja logis dan jelas?
- ✅ Apakah informasi yang dibutuhkan mudah ditemukan?
- ✅ Apakah sistem membantu pekerjaan sehari-hari?

**Cara Test:** Gunakan sistem seperti biasa, centang jika smooth, beri catatan jika ada masalah.

---

## PHASE 1: FITUR BISNIS KRITIS (5 Fitur)

### 1.1 📊 Forecast Buyer Feedback Workflow
**Tujuan:** Melacak progress negosiasi dengan buyer dari awal sampai deal/gagal

**Skenario User:**
- [ ] Buka forecast yang sudah approved
- [ ] Temukan section "Buyer Feedback" (mudah ditemukan?)
- [ ] Ubah status ke "FCO Sent" → Apakah status tersimpan?
- [ ] Ubah ke "Negotiation" dan tulis alasan → Apakah alasan bisa ditulis dengan jelas?
- [ ] Ubah ke "Deal" → Sistem mencegah ubah ke "Failed" setelah deal? (ini benar)
- [ ] Ubah forecast lain ke "Failed" dengan alasan → Apakah forecast ditandai gagal?
- [ ] Reload halaman → Apakah history perubahan masih muncul dengan tanggal?

**Pengalaman yang Baik:**
- Timeline history mudah dibaca dan kronologis
- Status dropdown jelas labelnya (tidak confusing)
- Alasan/notes cukup ruang untuk menulis detail
- Tidak perlu klik banyak untuk update status

**Catatan Masalah:**
_______________________________________________

---

### 1.2 📈 Sales Monitor Rollup
**Tujuan:** Melihat ringkasan penjualan per deal dan per project dalam satu tempat

**Skenario User:**
- [ ] Buka menu Sales Monitor
- [ ] Lihat tab "Deals" → Apakah list deal jelas dan mudah dipahami?
- [ ] Lihat tab "Project Rollup" → Apakah aggregasi data masuk akal?
- [ ] Lihat summary cards (Revenue, Volume, Deals, Shipments) → Angka sesuai harapan?
- [ ] Filter berdasarkan status → Apakah filter langsung bekerja di kedua tab?
- [ ] Search project → Apakah hasil search relevan?
- [ ] Klik baris deal → Apakah modal detail muncul dengan info lengkap?

**Pengalaman yang Baik:**
- Tab mudah dipahami (Deals vs Rollup jelas bedanya)
- Summary cards memberikan insight cepat
- Filter dan search bekerja instant tanpa lag
- Klik deal langsung ke detail (tidak perlu scroll atau cari tombol)

**Catatan Masalah:**
_______________________________________________

---

### 1.3 🎛️ Dashboard Filter
**Tujuan:** Filter data dashboard sesuai kebutuhan (negara, region, status, waktu)

**Skenario User:**
- [ ] Buka dashboard utama
- [ ] Ubah filter "Country" → Apakah semua widget update otomatis?
- [ ] Ubah filter "Region" → Data refresh dengan cepat?
- [ ] Ubah filter "Status" → Shipment terfilter sesuai pilihan?
- [ ] Ubah "Market Type" (domestic/export) → Metrics berubah?
- [ ] Pilih time range "30 hari" → Chart update?
- [ ] Pilih custom date range → Date picker mudah digunakan?
- [ ] Kombinasi beberapa filter → Hasilnya logis?

**Pengalaman yang Baik:**
- Filter mudah ditemukan di atas dashboard
- Perubahan filter instant (tidak perlu klik "Apply")
- Label filter jelas (tidak pakai istilah teknis)
- Reset filter mudah (ada tombol clear)

**Catatan Masalah:**
_______________________________________________

---

### 1.4 ✅ Approval Center - Expense Integration
**Tujuan:** Approve atau reject expense request dari staff

**Skenario User:**
- [ ] Staff membuat expense dan centang "Submit for approval"
- [ ] CEO/Manager buka Approval Center
- [ ] Apakah expense muncul di queue? (mudah ditemukan?)
- [ ] Klik expense → Detail lengkap muncul? (amount, category, receipt image?)
- [ ] Approve dengan komentar → Status berubah ke "Approved"?
- [ ] Reject expense lain dengan alasan → Status berubah ke "Rejected"?
- [ ] Staff buka halaman expense → Apakah status update terlihat jelas?
- [ ] History approval ada di expense detail?

**Pengalaman yang Baik:**
- Notification atau badge untuk pending approvals
- Receipt image terlihat jelas (tidak perlu download)
- Approve/Reject button jelas dan tidak berdampingan (avoid misclick)
- Komentar approval terlihat oleh staff yang submit

**Catatan Masalah:**
_______________________________________________

---

### 1.5 📦 Daily Delivery Document Tab
**Tujuan:** Upload dan tracking dokumen daily delivery (SKAB, DSR) per shipment

**Skenario User:**
- [ ] Buka detail shipment (domestic)
- [ ] Temukan tab "Daily Delivery" (mudah ditemukan di tab bar?)
- [ ] Klik tab → Halaman muncul tanpa error?
- [ ] Upload dokumen SKAB → Proses upload jelas?
- [ ] Upload dokumen DSR → File terlist setelah upload?
- [ ] Lihat status dokumen → Aging/status jelas?

**Pengalaman yang Baik:**
- Tab "Daily Delivery" jelas terlihat (tidak tersembunyi)
- Upload drag-and-drop atau button jelas
- Progress upload terlihat (tidak silent)
- List dokumen menunjukkan: nama file, tanggal upload, status

**Catatan Masalah:**
_______________________________________________

---

## PHASE 2: PENINGKATAN UX (5 Fitur)

### 2.1 🚨 Forecast Urgent Analysis
**Tujuan:** AI analisa seberapa urgent forecast (butuh perhatian segera atau tidak)

**Skenario User (CEO/Direksi only):**
- [ ] Buka forecast detail
- [ ] Temukan tombol "Urgent Analysis" (terlihat jelas?)
- [ ] Klik tombol → Loading indicator muncul?
- [ ] Tunggu 5-10 detik → Modal analisa terbuka?
- [ ] Baca laporan:
  - Urgency Level (CRITICAL/HIGH/MEDIUM/LOW) → Jelas?
  - Urgency Score (0-100) → Mudah dipahami?
  - Executive Summary → Ringkasan berguna?
  - Key Factors → Faktor penting tercantum?
  - Timeline Impact → Deadline jelas?
  - Financial Impact → Estimasi finansial masuk akal?
  - Risk Factors → Risiko teridentifikasi?
  - Recommendations → Saran actionable?
- [ ] Tutup modal → Buka lagi forecast → Analisa masih tersimpan?

**Pengalaman yang Baik:**
- Tombol hanya muncul untuk role executive (tidak confuse staff)
- Analisa tidak terlalu lama (max 10 detik)
- Laporan dalam bahasa bisnis (bukan teknis)
- Score dan level membantu prioritas kerja
- Bisa print atau share laporan

**Catatan Masalah:**
_______________________________________________

---

### 2.2 👁️ Deal Detail Modal
**Tujuan:** Quick view detail deal tanpa pindah halaman

**Skenario User:**
- [ ] Di Sales Monitor, klik baris deal mana saja
- [ ] Modal detail muncul instant?
- [ ] Info yang ditampilkan lengkap? (Deal info, Project, Buyer, Amount, Status, Tanggal)
- [ ] Klik backdrop (area gelap) → Modal tutup?
- [ ] Klik tombol X → Modal tutup?
- [ ] Buka beberapa deal berturut-turut → Data update benar?

**Pengalaman yang Baik:**
- Klik row langsung buka modal (intuitif)
- Modal tidak fullscreen (masih terlihat background)
- Info penting di atas, detail di bawah
- Tutup modal mudah (ESC key, backdrop, X button)

**Catatan Masalah:**
_______________________________________________

---

### 2.3 💹 Market Price Comparison
**Tujuan:** Bandingkan harga jual dengan benchmark pasar (ICI, HBA, Newcastle)

**Skenario User:**
- [ ] Buka Market Price
- [ ] Scroll ke section "Market Comparison"
- [ ] Pilih benchmark "ICI3" → Spread calculation muncul?
- [ ] Pilih "HBA" → Buying spread terupdate?
- [ ] Lihat color coding:
  - Hijau (spread >3) → Margin bagus
  - Merah (<-3) → Margin jelek
  - Kuning (neutral)
- [ ] Ubah benchmark → Semua nilai recalculate instant?
- [ ] Margin analysis (%) ditampilkan jelas?

**Pengalaman yang Baik:**
- Benchmark selector mudah dipahami (tidak pakai kode aneh)
- Color coding membantu quick decision
- Spread dijelaskan (positif = untung, negatif = rugi)
- Comparison card terlihat jelas (tidak di pojok)

**Catatan Masalah:**
_______________________________________________

---

### 2.4 📥 Blending Report Export
**Tujuan:** Export hasil simulasi blending ke CSV untuk analisa lanjutan

**Skenario User:**
- [ ] Buka Blending Simulator
- [ ] Tambah 2+ cargo dengan spec
- [ ] Set target spec
- [ ] Klik "Simulate" → Hasil muncul?
- [ ] Klik tombol "Export CSV" (mudah ditemukan?)
- [ ] File download otomatis? (nama file: blending-report-{timestamp}.csv)
- [ ] Buka CSV → Data lengkap? (cargo table, target specs, result, delta)
- [ ] Format CSV rapi? (bisa dibuka di Excel tanpa masalah)

**Pengalaman yang Baik:**
- Export button jelas terlihat setelah simulasi
- Download instant tanpa popup aneh
- File naming informatif (ada timestamp)
- CSV format Excel-friendly (tidak rusak)

**Catatan Masalah:**
_______________________________________________

---

### 2.5 ⏱️ Scraper Interval Persistence
**Tujuan:** Atur interval scraping harga pasar dan tersimpan permanen

**Skenario User:**
- [ ] Buka Market Price
- [ ] Temukan tombol "Scraping Settings"
- [ ] Klik → Modal setting terbuka?
- [ ] Lihat interval saat ini (jelas ditampilkan?)
- [ ] Ubah interval ke "1 minute" → Klik "Save Interval"
- [ ] Refresh halaman → Interval masih "1 minute"? (tersimpan)
- [ ] Ubah ke "6 hours" → Save → Scraper reschedule?
- [ ] Setting tetap tersimpan setelah logout/login?

**Pengalaman yang Baik:**
- Setting mudah ditemukan (tidak deep nested)
- Interval options jelas (1 min, 5 min, 1 jam, 6 jam)
- Save langsung apply (tidak perlu restart system)
- Ada feedback "Settings saved successfully"

**Catatan Masalah:**
_______________________________________________

---

## PHASE 3: AUDIT & COMPLIANCE (5 Fitur)

### 3.1 📰 Directory News Display
**Tujuan:** Lihat berita eksternal tentang partner saat due diligence

**Skenario User:**
- [ ] Buka Directory
- [ ] Klik "Analyze" pada partner
- [ ] Tunggu due diligence selesai
- [ ] Buka detail partner
- [ ] Scroll ke "AI Due Diligence"
- [ ] Temukan subsection "External News"
- [ ] News items muncul? (Title, Source, Published date)
- [ ] Klik link news → Buka di tab baru?
- [ ] Maksimal 5 news terlihat? (tidak overflow)

**Pengalaman yang Baik:**
- News section mudah ditemukan dalam due diligence report
- Headline jelas dan clickable
- Source kredibel (bukan asal-asalan)
- Tanggal publikasi membantu assess relevansi

**Catatan Masalah:**
_______________________________________________

---

### 3.2 ⚠️ Expense Anomaly Persistence
**Tujuan:** Sistem detect dan tandai expense yang anomali (terlalu besar)

**Skenario User:**
- [ ] Buat expense dengan amount besar (>2x average)
- [ ] Upload receipt → Klik "OCR Receipt"
- [ ] Warning muncul? (amount anomaly detected)
- [ ] Submit expense → Simpan
- [ ] Buka expense lagi → Anomaly flag masih ada?
- [ ] Di notes/detail, anomaly reason terlihat?
- [ ] Buat expense normal → Tidak ada warning (benar)

**Pengalaman yang Baik:**
- Warning tidak aggressive (tidak block submit)
- Reason anomaly jelas (contoh: "Amount 5x higher than average")
- Flag tersimpan untuk audit trail
- Manager/CEO bisa lihat anomaly flag saat review

**Catatan Masalah:**
_______________________________________________

---

### 3.3 ⚖️ Outstanding Payment Dispute Status
**Tujuan:** Tandai payment yang bermasalah (disputed, under review)

**Skenario User:**
- [ ] Buka Outstanding Payment
- [ ] Tambah payment baru
- [ ] Temukan field "Dispute Status" (terlihat jelas?)
- [ ] Pilih "None" → Simpan
- [ ] Edit payment → Ubah ke "Disputed" → Simpan
- [ ] Reload → Status masih "Disputed"?
- [ ] Ubah ke "Under Review" → Simpan
- [ ] Filter payment by dispute status (jika ada) → Bekerja?

**Pengalaman yang Baik:**
- Field tidak tersembunyi (mudah ditemukan di form)
- Options jelas: None / Disputed / Under Review
- Dispute status terlihat di list payment (color coded)
- Filter/sort by dispute status memudahkan tracking

**Catatan Masalah:**
_______________________________________________

---

### 3.4 📋 Forecast Document Templates
**Tujuan:** Pilih template dokumen sesuai tipe forecast (Export/Domestic/Spot)

**Skenario User:**
- [ ] Buat forecast baru
- [ ] Temukan dropdown "Document Template"
- [ ] Pilih "Export Shipment" → Checklist 11 item muncul? (a-k)
- [ ] Centang item "a" (LAPORAN HASIL VERIFIKASI) → Simpan draft
- [ ] Edit forecast → Checkbox masih tercentang?
- [ ] Ubah template ke "Domestic Delivery" → Checklist berubah? (5 items)
- [ ] Pilih "Spot Purchase" → Checklist berubah lagi? (5 items)
- [ ] Submit forecast → Checklist tersimpan ke database

**Pengalaman yang Baik:**
- Template selector terlihat jelas di form
- Checklist items relevan dengan tipe template
- Checkbox state tersimpan (tidak reset)
- Progress checklist terlihat (contoh: 3/11 completed)

**Catatan Masalah:**
_______________________________________________

---

### 3.5 📊 Market Price History Detail
**Tujuan:** Expand row untuk lihat detail snapshot semua indeks harga

**Skenario User:**
- [ ] Buka Market Price
- [ ] Scroll ke "Price History" table
- [ ] Temukan tombol expand (chevron) di row mana saja
- [ ] Klik expand → Section detail muncul?
- [ ] Expanded section menampilkan:
  - Record Info (ID, Created date)
  - Source
  - Action
  - Actor
  - Notes (jika ada)
  - Full Snapshot (grid 6 kolom dengan 12 indeks)
- [ ] Semua indeks terlihat? (ICI1-5, Newcastle, HBA, HBA I-III, MGO, USD/IDR)
- [ ] Klik collapse → Row tertutup?
- [ ] Expand row lain → Data benar?

**Pengalaman yang Baik:**
- Expand icon jelas (arrow down/up)
- Expanded area tidak terlalu lebar (scroll horizontal minimal)
- Grid layout rapi (6 kolom mudah dibaca)
- Collapse mudah (klik chevron lagi atau area lain)

**Catatan Masalah:**
_______________________________________________

---

## PHASE 4: FITUR ADVANCED (3 Fitur)

### 4.1 🎥 Meetings Video MOM Tab
**Tujuan:** Upload video meeting untuk auto-generate Minutes of Meeting (placeholder)

**Skenario User:**
- [ ] Buka Meetings → Detail meeting
- [ ] Temukan tab "Video MOM" (terlihat di tab bar?)
- [ ] Klik tab → Halaman muncul tanpa error?
- [ ] Lihat warning: "Requires Flask MOM processor at localhost:8080"
- [ ] File input untuk video terlihat?
- [ ] Pilih video file → Alert muncul dengan instruksi?
- [ ] Instruksi jelas untuk next steps?

**Pengalaman yang Baik:**
- Tab struktur sudah siap (tidak error)
- Warning jelas bahwa fitur masih placeholder
- Instruksi integrasi Flask mudah dipahami
- UI tidak crash saat klik

**Catatan Masalah:**
_______________________________________________

---

### 4.2 🤖 AI Agent Shipment/Source Context
**Tujuan:** AI Agent punya context lengkap tentang shipment, delivery, source

**Skenario User:**
- [ ] (Test via API atau frontend AI Agent jika sudah dibuat)
- [ ] Tanya: "How many shipments?" → AI jawab dengan data shipment?
- [ ] Tanya: "Show me sources" → AI jawab dengan data sources?
- [ ] Tanya: "List deliveries" → AI jawab dengan delivery log?
- [ ] Tanya pertanyaan generic → AI kasih summary stats?

**Pengalaman yang Baik:**
- AI context mencakup 4 workbooks (Shipment, Delivery, Forecast, Sources)
- Jawaban AI relevan dan akurat
- Response time cepat (<5 detik)
- Tidak perlu tanya berulang untuk data yang sama

**Catatan Masalah:**
_______________________________________________

---

### 4.3 📄 Forecast SI Generation
**Tujuan:** Generate PDF Shipping Instruction dari forecast approved/deal

**Skenario User:**
- [ ] Buka forecast dengan status "Approved" atau "Deal"
- [ ] Temukan tombol "Generate SI" (mudah ditemukan?)
- [ ] Klik tombol → PDF download otomatis?
- [ ] Buka PDF (nama file: SI-{projectName}.pdf)
- [ ] PDF berisi:
  - Header: "SHIPPING INSTRUCTION"
  - SI Number
  - TO: PT. FONTANA RESOURCES INDONESIA
  - Project Name
  - Shipper, Consignee, Notify Party
  - Quantity, Nomination, Loading Port, Discharge Port
  - Laycan
  - Shipping Term
  - Coal Specification (jika ada)
  - Analysis Method
  - Marked text
- [ ] Generate dari forecast lain → SI number unique?
- [ ] Format PDF professional? (bisa langsung dikirim ke partner)

**Pengalaman yang Baik:**
- Tombol hanya muncul untuk status approved/deal (tidak semua forecast)
- PDF generate instant (tidak perlu tunggu lama)
- Layout PDF rapi dan professional
- Semua field terisi lengkap (tidak ada [undefined])

**Catatan Masalah:**
_______________________________________________

---

## PENGALAMAN KESELURUHAN SISTEM

### Navigasi & Layout
- [ ] Menu navigasi mudah dipahami (tidak perlu training)
- [ ] Breadcrumb membantu tahu posisi di sistem
- [ ] Search global bekerja (temukan data cepat)
- [ ] Responsive di tablet/mobile? (jika diakses dari HP)

### Performance
- [ ] Halaman load cepat (<3 detik)
- [ ] Tidak ada lag saat klik button
- [ ] Filter dan search instant
- [ ] Tidak ada freeze/hang saat input data

### Konsistensi UI
- [ ] Button style konsisten (primary, secondary, danger)
- [ ] Form layout konsisten di semua modul
- [ ] Modal/drawer style seragam
- [ ] Color coding logis (hijau = sukses, merah = danger, kuning = warning)

### Error Handling
- [ ] Error message jelas dan membantu (bukan "Error 500")
- [ ] Validation message muncul di field yang salah
- [ ] Tidak ada crash tanpa pesan error
- [ ] Ada cara untuk recover dari error (refresh, back button)

### Onboarding
- [ ] User baru bisa paham sistem tanpa tutorial panjang?
- [ ] Tooltip/hint membantu di fitur kompleks?
- [ ] Empty state jelas (ketika belum ada data, ada instruksi apa yang harus dilakukan)

---

## CATATAN UMUM & FEEDBACK

### Apa yang Paling Membantu:
_______________________________________________
_______________________________________________
_______________________________________________

### Apa yang Paling Membingungkan:
_______________________________________________
_______________________________________________
_______________________________________________

### Fitur yang Sering Digunakan:
_______________________________________________
_______________________________________________
_______________________________________________

### Fitur yang Jarang/Tidak Digunakan:
_______________________________________________
_______________________________________________
_______________________________________________

### Saran Perbaikan:
_______________________________________________
_______________________________________________
_______________________________________________

---

## SIGN-OFF

**Tested By:** _________________  
**Role:** _________________  
**Date:** _________________  
**Overall Experience (1-10):** _____  
**Ready to Use Daily:** [ ] Yes  [ ] No  

**Keputusan:**
- [ ] Siap production (smooth, tidak ada blocker)
- [ ] Perlu perbaikan kecil (usable, tapi ada minor issue)
- [ ] Perlu perbaikan besar (banyak masalah UX)

---

**Generated:** 2026-07-26  
**Focus:** User Experience & Usability Testing

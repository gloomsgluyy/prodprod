# QA TESTING CHECKLIST — CoalTrade OS Rewrite

- **Version:** 2.0 (User Experience Focus)
- **Last Updated:** 2026-07-26
- **Focus:** Kemudahan penggunaan dan efektivitas sistem
- **Tested By:** Rakha FR (QA Tester)
- **Test Date:** 26/08/2026
- **Overall Experience Score:** 3/10
- **Ready to Use Daily:** No
- **Base URL aplikasi:** `https://coaltrade.gamblingslayer.site`

> Dokumen ini adalah hasil konversi dari file Word `CoalTrade_OS_QA_User_Flow_Checklist` (berisi tabel status QA, catatan tester, screenshot bug, dan raw console log browser) menjadi format Markdown teks-murni, supaya lebih mudah di-parse oleh AI coding agent untuk troubleshooting dan bug fixing. Semua screenshot sudah dideskripsikan dalam teks. Log console yang berulang identik sudah dirapikan (di-dedupe) dengan catatan jumlah pengulangan, tanpa menghilangkan informasi error yang unik.

---

## CARA MENGGUNAKAN CHECKLIST INI (dari dokumen asli)

Checklist ini dibuat untuk pengguna bisnis (bukan programmer), fokus pada:
- Apakah fitur mudah digunakan?
- Apakah alur kerja logis dan jelas?
- Apakah informasi yang dibutuhkan mudah ditemukan?
- Apakah sistem membantu pekerjaan sehari-hari?

**Cara Test:** Gunakan sistem seperti biasa, centang jika smooth, beri catatan jika ada masalah.

**Legenda status QA:** `Smooth` = lancar/tidak ada masalah · `Partial` = sebagian bekerja/ada catatan · `Bermasalah` = gagal/bug · `[Status belum diisi]` = tester tidak mencentang/mengisi status (kemungkinan skenario belum sempat dites tuntas atau belum sempat dicatat hasilnya).

---

## RINGKASAN BUG PRIORITAS TINGGI (agregasi tambahan untuk memudahkan triase)

> Bagian ini **bukan** bagian asli dari dokumen Word, melainkan ringkasan yang saya susun dari seluruh "Catatan Masalah" di bawah, supaya AI coding agent bisa cepat memprioritaskan. Detail lengkap tiap poin ada di masing-masing section fitur.

1. **`POST /api/market-scrape` → 403 (Forbidden)** — Staff/role non-executive tidak bisa submit form terkait market scrape (mempengaruhi Forecast Buyer Feedback & Approval Center - Expense Integration). Kemungkinan masalah role/permission di backend.
2. **`POST /api/expenses` → 422 (Unprocessable Content)** dan **`POST /api/expenses/ocr` → 500 (Internal Server Error)** — Approval Center - Expense Integration & Expense Anomaly Detection sama sekali tidak bisa dipakai (staff tidak bisa submit expense, OCR receipt tidak jalan). Response OCR yang gagal (500, body kosong) menyebabkan error turunan di frontend saat parsing JSON (`Unexpected end of JSON input`).
3. **AI Agent (fitur 4.2) masih dalam mode stub** — Bukan bug, tapi catatan penting: seluruh jawaban AI Agent saat ini adalah *hardcoded/stub response*, bukan LLM sungguhan. Perlu set environment variable `GROQ_API_KEY` agar integrasi Groq AI aktif. Selain itu ada bug data: total buyer volume selalu 0 MT, dan jawaban untuk pertanyaan agregat (mis. "total BL di delivery log", "forecast waiting approval") malah men-dump raw JSON record mentah alih-alih menghitung/filter jawabannya.
4. **Blending Simulator — kalkulasi Total Qty salah** — Field "TOTAL QTY (MT)" tidak menjumlahkan angka dengan benar; hasilnya terlihat seperti string yang digabung (concatenated), bukan dijumlahkan secara numerik. Field GAR/TS/ASH/TM live preview juga menampilkan 0.
5. **Global Search tidak berfungsi** (di bagian "Navigasi & Layout") — ditandai tester sebagai **urgent**.
6. **Dashboard Filter (Market Type & Time Range) tidak berfungsi** — filter "domestic/export" tidak konsisten dengan data di shipment, dan filter custom time range tidak benar-benar memfilter data (bug).
7. **React hydration error (Minified React error #418)** muncul saat memakai Blending Report Export — biasanya menandakan HTML hasil server-side render tidak cocok dengan client-side render.
8. **Meetings — Video MOM**: form input file untuk upload video tidak ada sama sekali di tab "Video MOM"; endpoint `transcribe` dan `extract-tasks` mengembalikan 500.
9. **Deal Detail Modal (Sales Monitor) tidak terbuka sama sekali** saat baris deal diklik — blocking, membuat beberapa skenario turunan tidak bisa dites.
10. **Forecast Urgent Analysis** — modal tidak terbuka / stuck loading setelah tombol diklik, sehingga laporan analisa tidak pernah muncul.
11. Error umum yang muncul berulang di banyak halaman: `Uncaught TypeError: Cannot read properties of undefined (reading 'startTime') at et.reportAllChanges` — kemungkinan terkait library web-vitals/performance reporting, tidak terikat ke satu fitur spesifik.
12. **Catatan noise:** Banyak log berformat `content.js:... CSS Inspector ...` dan `ColorScanner: ...` bukan berasal dari aplikasi CoalTrade, melainkan dari **browser extension** milik tester (semacam CSS/color inspector tool). AI agent tidak perlu menganggap ini sebagai bug aplikasi.

---

# PHASE 1: FITUR BISNIS KRITIS (5 Fitur)

## 1.1 📊 Forecast Buyer Feedback Workflow

**Tujuan:** Melacak progress negosiasi dengan buyer dari awal sampai deal/gagal

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka forecast yang sudah approved | Smooth | - |
| 2 | Temukan section "Buyer Feedback" (mudah ditemukan?) | Smooth | - |
| 3 | Ubah status ke "FCO Sent" -> Apakah status tersimpan? | Partial | Table FCO seharusnya diganti ke "sent" jangan "v1", atau bisa digabung jadi label "sent v1" |
| 4 | Ubah ke "Negotiation" dan tulis alasan -> Apakah alasan bisa ditulis dengan jelas? | Partial | Ada nya revisi.. |
| 5 | Ubah ke "Deal" -> Sistem mencegah ubah ke "Failed" setelah deal? | Smooth | Ini benar (perilaku sudah sesuai ekspektasi) |
| 6 | Ubah forecast lain ke "Failed" dengan alasan -> Apakah forecast ditandai gagal? | Smooth | - |
| 7 | Reload halaman -> Apakah history perubahan masih muncul dengan tanggal? | Smooth | - |

**Pengalaman yang Baik:**
- Timeline history mudah dibaca dan kronologis
- Status dropdown jelas labelnya (tidak confusing)
- Alasan/notes cukup ruang untuk menulis detail
- Tidak perlu klik banyak untuk update status

**Bug / Catatan Masalah:**
```
Failed to load resource: the server responded with a status of 409 ()
api/forecasts/0a5f7f...0fa0/generate-fco:1
```
1. Kemungkinan error 409 di atas disebabkan ketika ada data yang kosong saat edit/create, tapi tetap dicoba di-approve, sehingga muncul error tersebut.
2. **URGENT** — ANALYST ERROR atau loading-nya lama.
3. Data statistik kosong di forecast sales.
4. Loading animation-nya menjadi double — tolong diperbaiki (ini masalah universal di semua tombol biru).
5. Table "Margin est" kosong.
6. Saran: kalau bisa diberikan popup ketika klik data table yang kosong, untuk menunjukkan di mana cara mengisinya.
7. Di sisi staff malah tidak bisa membuat forecast sales:
   ```
   layout-a2a84a609416bd8c.js:1 POST https://coaltrade.gamblingslayer.site/api/market-scrape 403 (Forbidden)
   ```
8. Di sisi shipment maupun sales monitor tidak bisa mengisi form. (Screenshot menunjukkan network request yang sama: `POST https://coaltrade.gamblingslayer.site/api/market-scrape` → `403 (Forbidden)`, dipicu dari `layout-a2a84a609416bd8c.js:1`.)

---

## 1.2 📈 Sales Monitor Rollup

**Tujuan:** Melihat ringkasan penjualan per deal dan per project dalam satu tempat

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka menu Sales Monitor | Smooth | - |
| 2 | Lihat tab "Deals" -> Apakah list deal jelas dan mudah dipahami? | Smooth | - |
| 3 | Lihat tab "Project Rollup" -> Apakah agregasi data masuk akal? | Partial | Agak bingung tempat masuk data deals sama shipment-nya |
| 4 | Lihat summary cards (Revenue, Volume, Deals, Shipments) -> Angka sesuai harapan? | Partial | Ketika memfilter atau search, hasilnya malah terbalik — posisi hasil search/filter tidak sesuai ekspektasi (harusnya di atas, malah di bawah) |
| 5 | Filter berdasarkan status -> Apakah filter langsung bekerja di kedua tab? | **Bermasalah** | Filter tidak ada hasil / KOSONG |
| 6 | Search project -> Apakah hasil search relevan? | **Bermasalah** | Hasil pencarian malah terbalik (urutan/relevansi salah) |
| 7 | Klik baris deal -> Apakah modal detail muncul dengan info lengkap? | Partial | Isi data linked project dan shipment apa (perlu ditampilkan lebih jelas) |

**Pengalaman yang Baik:**
- Tab mudah dipahami (Deals vs Rollup jelas bedanya)
- Summary cards memberikan insight cepat
- Filter dan search bekerja instant tanpa lag
- Klik deal langsung ke detail (tidak perlu scroll atau cari tombol)

**Bug / Catatan Masalah:**
1. Saran: kalau bisa diberikan popup ketika klik data table yang kosong, untuk menunjukkan di mana cara mengisinya (catatan sama seperti di 1.1).

---

## 1.3 🎛️ Dashboard Filter

**Tujuan:** Filter data dashboard sesuai kebutuhan (negara, region, status, waktu)

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka dashboard utama | Smooth | - |
| 2 | Ubah filter "Country" -> Apakah semua widget update otomatis? | Partial | Kalau bisa di halaman shipment juga diberi dropdown untuk country yang sudah dibuat |
| 3 | Ubah filter "Region" -> Data refresh dengan cepat? | Partial | Kalau bisa di halaman shipment juga diberi dropdown untuk region yang sudah dibuat |
| 4 | Ubah filter "Status" -> Shipment terfilter sesuai pilihan? | Smooth | - |
| 5 | Ubah "Market Type" (domestic/export) -> Metrics berubah? | **Bermasalah** | Tester mengubah data shipment jadi "domestic", tapi dashboard belum membaca perubahan tersebut (data tidak sinkron) |
| 6 | Pilih time range "30 hari" -> Chart update? | **Bermasalah** | Saat memilih range custom di masa depan, chart tetap memakai data yang sama sekali tidak sesuai filter — **filter time range masih bug** |
| 7 | Pilih custom date range -> Date picker mudah digunakan? | **Bermasalah** | Belum bisa lanjut testing (terhalang bug di atas) |
| 8 | Kombinasi beberapa filter -> Hasilnya logis? | **Bermasalah** | Belum bisa lanjut testing (terhalang bug di atas) |

**Pengalaman yang Baik:**
- Filter mudah ditemukan di atas dashboard
- Perubahan filter instant (tidak perlu klik "Apply")
- Label filter jelas (tidak pakai istilah teknis)
- Reset filter mudah (ada tombol clear)

**Bug / Catatan Masalah:**
- Tidak ada error dari console untuk fitur ini (bug-nya bersifat data/logic, bukan exception JS).

---

## 1.4 ✅ Approval Center - Expense Integration

**Tujuan:** Approve atau reject expense request dari staff

**Hasil Test:**

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Staff membuat expense dan centang "Submit for approval" | **Bermasalah** |
| 2 | CEO/Manager buka Approval Center | **Bermasalah** |
| 3 | Apakah expense muncul di queue? (mudah ditemukan?) | **Bermasalah** |
| 4 | Klik expense -> Detail lengkap muncul? (amount, category, receipt image?) | **Bermasalah** |
| 5 | Approve dengan komentar -> Status berubah ke "Approved"? | **Bermasalah** |
| 6 | Reject expense lain dengan alasan -> Status berubah ke "Rejected"? | **Bermasalah** |
| 7 | Staff buka halaman expense -> Apakah status update terlihat jelas? | **Bermasalah** |
| 8 | History approval ada di expense detail? | **Bermasalah** |

> Seluruh alur ini gagal total (semua baris "Bermasalah") — kemungkinan besar blocking issue tunggal di awal alur (submit expense) yang membuat semua langkah berikutnya tidak bisa dites.

**Pengalaman yang Baik (menurut desain, belum tentu tercapai saat ini):**
- Notification atau badge untuk pending approvals
- Receipt image terlihat jelas (tidak perlu download)
- Approve/Reject button jelas dan tidak berdampingan (avoid misclick)
- Komentar approval terlihat oleh staff yang submit

**Bug / Catatan Masalah:**
```
layout-a2a84a609416bd8c.js:1 POST https://coaltrade.gamblingslayer.site/api/market-scrape 403 (Forbidden)
```
Error di atas muncul **3 kali berturut-turut** di console (request/retry yang sama, response selalu 403 Forbidden).

1. Tidak bisa mengisi form di sisi staff (tester memakai akun trader dengan role "staff").

---

## 1.5 📦 Daily Delivery Document Tab

**Tujuan:** Upload dan tracking dokumen daily delivery (SKAB, DSR) per shipment

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka detail shipment (domestic) | Smooth | - |
| 2 | Temukan tab "Daily Delivery" (mudah ditemukan di tab bar?) | Smooth | - |
| 3 | Klik tab -> Halaman muncul tanpa error? | Smooth | Mungkin instruksinya bisa diperjelas lagi |
| 4 | Upload dokumen SKAB -> Proses upload jelas? | Smooth | - |
| 5 | Upload dokumen DSR -> File terlist setelah upload? | Smooth | - |
| 6 | Lihat status dokumen -> Aging/status jelas? | Smooth | Fitur "Aging" saat ini belum tersedia (kosong) |

**Pengalaman yang Baik:**
- Tab "Daily Delivery" jelas terlihat (tidak tersembunyi)
- Upload drag-and-drop atau button jelas
- Progress upload terlihat (tidak silent)
- List dokumen menunjukkan: nama file, tanggal upload, status

**Bug / Catatan Masalah:** Tidak ada error dari console.

---

# PHASE 2: PENINGKATAN UX (5 Fitur)

## 2.1 🚨 Forecast Urgent Analysis

**Tujuan:** AI analisa seberapa urgent forecast (butuh perhatian segera atau tidak)

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka forecast detail (CEO/Direksi only) | Smooth | - |
| 2 | Temukan tombol "Urgent Analysis" (terlihat jelas?) | Smooth | - |
| 3 | Klik tombol -> Loading indicator muncul? | Smooth | - |
| 4 | Tunggu 5-10 detik -> Modal analisa terbuka? | **Bermasalah** | Modal tidak terbuka sama sekali |
| 5 | Baca laporan: Urgency Level, Urgency Score, Executive Summary, Key Factors, Timeline Impact, Financial Impact, Risk Factors, Recommendations -> semua jelas dan berguna? | **Bermasalah** | Tidak ada yang muncul dari langkah sebelumnya, stuck loading |
| 6 | Tutup modal -> Buka lagi forecast -> Analisa masih tersimpan? | **Bermasalah** | Tidak bisa lanjut (blocked oleh bug di langkah 4) |

**Pengalaman yang Baik (target desain):**
- Tombol hanya muncul untuk role executive (tidak confuse staff)
- Analisa tidak terlalu lama (max 10 detik)
- Laporan dalam bahasa bisnis (bukan teknis)
- Score dan level membantu prioritas kerja
- Bisa print atau share laporan

**Bug / Catatan Masalah:** Tidak ada error dari console (modal stuck loading tanpa exception yang tercatat — kemungkinan request pending/hang atau response tidak pernah diterima front-end).

---

## 2.2 👁️ Deal Detail Modal

**Tujuan:** Quick view detail deal tanpa pindah halaman

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Di Sales Monitor, klik baris deal mana saja | Smooth | - |
| 2 | Modal detail muncul instant? | **Bermasalah** | Modal tidak muncul saat baris table di-klik |
| 3 | Info yang ditampilkan lengkap? (Deal info, Project, Buyer, Amount, Status, Tanggal) | **Bermasalah** | Belum bisa lanjut, karena modal belum kebuka |
| 4 | Klik backdrop (area gelap) -> Modal tutup? | **Bermasalah** | Belum bisa lanjut, karena modal belum kebuka |
| 5 | Klik tombol X -> Modal tutup? | **Bermasalah** | Belum bisa lanjut, karena modal belum kebuka |
| 6 | Buka beberapa deal berturut-turut -> Data update benar? | **Bermasalah** | Belum bisa lanjut, karena modal belum kebuka |

**Pengalaman yang Baik (target desain):**
- Klik row langsung buka modal (intuitif)
- Modal tidak fullscreen (masih terlihat background)
- Info penting di atas, detail di bawah
- Tutup modal mudah (ESC key, backdrop, X button)

**Bug / Catatan Masalah:** Tidak ada error dari console (kemungkinan besar handler `onClick` di baris table tidak ter-attach atau state modal tidak ter-trigger — perlu dicek langsung di kode komponen table Sales Monitor).

---

## 2.3 💹 Market Price Comparison

**Tujuan:** Bandingkan harga jual dengan benchmark pasar (ICI, HBA, Newcastle)

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka Market Price | Smooth | - |
| 2 | Scroll ke section "Market Comparison" | Smooth | - |
| 3 | Pilih benchmark "ICI3" -> Spread calculation muncul? | Smooth | - |
| 4 | Pilih "HBA" -> Buying spread terupdate? | Smooth | - |
| 5 | Lihat color coding: Hijau (spread >3, margin bagus), Merah (<-3, margin jelek), Kuning (neutral) | Smooth | Warnanya (hijau/merah/kuning) tidak terlihat di UI |
| 6 | Ubah benchmark -> Semua nilai recalculate instant? | Smooth | - |
| 7 | Margin analysis (%) ditampilkan jelas? | Smooth | - |

**Pengalaman yang Baik:**
- Benchmark selector mudah dipahami (tidak pakai kode aneh)
- Color coding membantu quick decision
- Spread dijelaskan (positif = untung, negatif = rugi)
- Comparison card terlihat jelas (tidak di pojok)

**Bug / Catatan Masalah:**
- **Validasi input tidak strict:** input seperti `19.` (angka dengan titik tanpa desimal di belakang, format tidak valid) tetap bisa disubmit meskipun field sudah berwarna merah (menandakan error validasi) — validasi hanya visual, tidak benar-benar memblokir submit.

```
content.js:812 CSS Inspector content script initialized
content.js:1640 CSS Inspector: Starting color palette preload...
content.js:1733 CSS Inspector: Styles ready, test color: oklch(0.27 0 0)
content.js:61 ColorScanner: Starting scan of 12925 elements
content.js:73 ColorScanner: Using chunk size 129 for 12925 elements
content.js:190 ColorScanner: Element 1 (HTML) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 2 (BODY) found 10 colors: Array(10)
content.js:190 ColorScanner: Element 3 (DIV) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 4 (ASIDE) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 5 (HEADER) found 9 colors: Array(9)
content.js:115 ColorScanner: Progress 0% (0/12925 elements)
... (progress log naik dari 10% s/d 100%) ...
content.js:128 ColorScanner: Scan completed. ColorMap size: 21, Final colors: 2
content.js:690 ColorScanner: Scan completed with stats: Object
content.js:1676 CSS Inspector: Color palette preloaded successfully - 2 colors found
```
> ⚠️ Catatan: log `content.js` / "CSS Inspector" / "ColorScanner" di atas **bukan berasal dari aplikasi CoalTrade**, melainkan dari browser extension tester (semacam tool inspect warna CSS). Aman diabaikan saat debugging aplikasi.

Error JS asli aplikasi yang tercatat di halaman ini:
```
VM251:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at <anonymous>:2:13070
    at <anonymous>:2:331
    at d (<anonymous>:2:6141)
    at <anonymous>:2:6326
    at <anonymous>:2:2895
    at n.timeout (<anonymous>:2:5652)
```

---

## 2.4 📥 Blending Report Export

**Tujuan:** Export hasil simulasi blending ke CSV untuk analisa lanjutan

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka Blending Simulator | Smooth | - |
| 2 | Tambah 2+ cargo dengan spec | Smooth | - |
| 3 | Set target spec | Smooth | - |
| 4 | Klik "Simulate" -> Hasil muncul? | Smooth | - |
| 5 | Klik tombol "Export CSV" (mudah ditemukan?) | Smooth | Saat ini tulisan tombolnya "Download" — tolong ganti jadi "Export CSV" supaya user tidak perlu mencari-cari |
| 6 | File download otomatis? (nama file: blending-report-{timestamp}.csv) | Smooth | - |
| 7 | Buka CSV -> Data lengkap? (cargo table, target specs, result, delta) | Smooth | - |
| 8 | Format CSV rapi? (bisa dibuka di Excel tanpa masalah) | Smooth | - |

**Pengalaman yang Baik:**
- Export button jelas terlihat setelah simulasi
- Download instant tanpa popup aneh
- File naming informatif (ada timestamp)
- CSV format Excel-friendly (tidak rusak)

**Bug / Catatan Masalah — BUG PENTING (kalkulasi salah):**

Screenshot menunjukkan form Blending Simulator dengan 3 baris cargo:
| Cargo | Load from Source | Qty (MT) | GAR | TS % |
|---|---|---|---|---|
| ANS | ANS | 15000 | 5000 | 0,4 |
| Anto | Anto | 25000 | 4500 | 0,6 |
| Pelaihari | Pelaihari | 10000 | 3800 | 1,2 |

Pada panel **Live Preview**, field-field berikut menampilkan nilai yang salah:
- **TOTAL QTY (MT): `150.002.500.010.000`** — seharusnya `50000` (hasil penjumlahan 15000 + 25000 + 10000). Angka yang muncul terlihat seperti hasil **penggabungan string (string concatenation)** dari "15000", "25000", "10000" (dengan pemisah ribuan otomatis dari formatter angka), **bukan penjumlahan numerik**. Ini kemungkinan bug tipe data (variabel Qty dibaca sebagai string, bukan number, sebelum dijumlahkan/di-`reduce`).
- **GAR (KCAL/KG): 0** — seharusnya terhitung sebagai weighted average.
- **TS (%): 0** — seharusnya terhitung sebagai weighted average.
- **ASH (%): 0** — seharusnya terhitung sebagai weighted average.
- **TM (%): 0** — seharusnya terhitung sebagai weighted average.

> Catatan tambahan: pada screenshot yang sama, di sisi kanan terlihat jendela browser Google "Mode AI" berisi hasil perhitungan manual yang tester lakukan sebagai pembanding (Cargo C: Qty=10000, GAR=3800, TS%=1.2, ASH%=12.0, TM%=38.0 → Expected: Total Qty 50000, GAR 4510, TS 0.66%, ASH 8.2%, TM 32.0%). **Ini bukan bagian dari aplikasi CoalTrade** — itu hanya alat bantu hitung manual eksternal milik tester untuk verifikasi angka yang benar seharusnya berapa.

Kutipan catatan tester: "DI BAGIAN KARGO INPUT BERMASALAH ANGKA NYA PADAHAL GAK ADA YANG STRICT TULISANNYA. ITU KETIKA GW KLIK PANAH ATAS/BAWAH JADI KAYAK GITU ANGKA TOTAL QTY TOLONG SEGERA PERBAIKI" — mengindikasikan bug muncul/diperparah saat memakai tombol panah atas/bawah (stepper) pada input angka Qty.

```
content.js:812 CSS Inspector content script initialized
content.js:1640 CSS Inspector: Starting color palette preload...
```
*(noise browser extension, sama seperti di atas — diabaikan)*

**Error React (penting):**
```
4bd1b696-182b6b13bdad92e3.js:1 Uncaught Error: Minified React error #418; visit
https://react.dev/errors/418?args[]=text&args[]= for the full message or use the
non-minified dev environment for full errors and additional helpful warnings.
    at rD (4bd1b696-182b6b13bdad92e3.js:1:35062)
    at rO (4bd1b696-182b6b13bdad92e3.js:1:36095)
    at 4bd1b696-182b6b13bdad92e3.js:1:118083
    at ix (4bd1b696-182b6b13bdad92e3.js:1:122955)
    at ik (4bd1b696-182b6b13bdad92e3.js:1:114743)
    at 4bd1b696-182b6b13bdad92e3.js:1:110730
    at iu (4bd1b696-182b6b13bdad92e3.js:1:110831)
    at iX (4bd1b696-182b6b13bdad92e3.js:1:132934)
    at MessagePort.w (1255-13d973e0759ea6d6.js:1:65046)
```
> React error #418 pada build production biasanya berarti **hydration mismatch** — HTML yang dirender di server tidak sama dengan yang dirender di client saat React "mengambil alih" (hydrate). Sering disebabkan oleh nilai yang berbeda antara server/client (misalnya format angka, `Date.now()`, locale, atau — relevan di sini — kemungkinan terkait langsung dengan bug Total Qty di atas jika nilai yang dirender berubah tipe data saat hydration).

```
content.js:1733 CSS Inspector: Styles ready, test color: oklch(0.27 0 0)
content.js:61 ColorScanner: Starting scan of 411 elements
content.js:73 ColorScanner: Using chunk size 50 for 411 elements
content.js:190 ColorScanner: Element 1 (HTML) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 2 (BODY) found 10 colors: Array(10)
content.js:190 ColorScanner: Element 3 (DIV) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 4 (ASIDE) found 9 colors: Array(9)
content.js:190 ColorScanner: Element 5 (HEADER) found 9 colors: Array(9)
content.js:128 ColorScanner: Scan completed. ColorMap size: 18, Final colors: 2
content.js:690 ColorScanner: Scan completed with stats: Object
content.js:1676 CSS Inspector: Color palette preloaded successfully - 2 colors found
```
*(noise browser extension — diabaikan)*

---

## 2.5 ⏱️ Scraper Interval Persistence

**Tujuan:** Atur interval scraping harga pasar dan tersimpan permanen

**Hasil Test:**

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Buka Market Price | Smooth |
| 2 | Temukan tombol "Scraping Settings" | Smooth |
| 3 | Klik -> Modal setting terbuka? | Smooth |
| 4 | Lihat interval saat ini (jelas ditampilkan?) | Smooth |
| 5 | Ubah interval ke "1 minute" -> Klik "Save Interval" | Smooth |
| 6 | Refresh halaman -> Interval masih "1 minute"? (tersimpan) | Smooth |
| 7 | Ubah ke "6 hours" -> Save -> Scraper reschedule? | Smooth |
| 8 | Setting tetap tersimpan setelah logout/login? | Smooth |

**Pengalaman yang Baik:**
- Setting mudah ditemukan (tidak deep nested)
- Interval options jelas (1 min, 5 min, 1 jam, 6 jam)
- Save langsung apply (tidak perlu restart system)
- Ada feedback "Settings saved successfully"

**Bug / Catatan Masalah:** Tidak ada error dari console. **Fitur ini bekerja dengan baik (fully smooth), tidak ada perbaikan yang diperlukan.**

---

# PHASE 3: AUDIT & COMPLIANCE (5 Fitur)

## 3.1 📰 Directory News Display

**Tujuan:** Lihat berita eksternal tentang partner saat due diligence

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka Directory | Smooth | - |
| 2 | Klik "Analyze" pada partner | **Bermasalah** | Tidak ada tombol "Analyze" — yang ada tombol "Run Due Diligence" (nama tombol beda dari skenario test) |
| 3 | Tunggu due diligence selesai | Partial | Jika klik "Run Due Diligence", berarti benar dan hasilnya muncul |
| 4 | Buka detail partner | Partial | Isi contact atau detail partner tidak ada |
| 5 | Scroll ke "AI Due Diligence" | Smooth | - |
| 6 | Temukan subsection "External News" | Smooth | - |
| 7 | News items muncul? (Title, Source, Published date) | **Bermasalah** | Kosong melompong: **"No external news found"** |
| 8 | Klik link news -> Buka di tab baru? | **Bermasalah** | Tidak bisa (seharusnya kalau error pun harus tetap melempar/redirect, tapi ini tidak) |
| 9 | Maksimal 5 news terlihat? (tidak overflow) | **Bermasalah** | Belum bisa lanjut, terhalang oleh bug di step sebelumnya |

**Pengalaman yang Baik (target desain):**
- News section mudah ditemukan dalam due diligence report
- Headline jelas dan clickable
- Source kredibel (bukan asal-asalan)
- Tanggal publikasi membantu assess relevansi

**Bug / Catatan Masalah:** Tidak ada error dari console (bug bersifat data kosong / UI copy tidak sesuai desain, bukan exception).

---

## 3.2 ⚠️ Expense Anomaly Persistence

**Tujuan:** Sistem detect dan tandai expense yang anomali (terlalu besar)

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buat expense dengan amount besar (>2x average) | Smooth | - |
| 2 | Upload receipt -> Klik "OCR Receipt" | **Bermasalah** | Tidak ada apa-apa yang muncul |
| 3 | Warning muncul? (amount anomaly detected) | **Bermasalah** | Tidak muncul |
| 4 | Submit expense -> Simpan | Partial | Bisa di awal, tapi setelahnya tidak bisa lagi |
| 5 | Buka expense lagi -> Anomaly flag masih ada? | **Bermasalah** | Tidak bisa lanjut, tertahan tidak bisa save draft dan submit |
| 6 | Di notes/detail, anomaly reason terlihat? | **Bermasalah** | Tidak bisa lanjut, tertahan tidak bisa save draft dan submit |
| 7 | Buat expense normal -> Tidak ada warning (benar) | **Bermasalah** | Tidak bisa lanjut, tertahan tidak bisa save draft dan submit |

**Pengalaman yang Baik (target desain):**
- Warning tidak aggressive (tidak block submit)
- Reason anomaly jelas (contoh: "Amount 5x higher than average")
- Flag tersimpan untuk audit trail
- Manager/CEO bisa lihat anomaly flag saat review

**Bug / Catatan Masalah — ini bagian console log terpanjang di seluruh dokumen QA:**

```
content.js:812 CSS Inspector content script initialized
content.js:1640 CSS Inspector: Starting color palette preload...
content.js:1733 CSS Inspector: Styles ready, test color: oklch(0.27 0 0)
content.js:61 ColorScanner: Starting scan of 83 elements
... (ColorScanner noise, browser extension - diabaikan) ...
```

```
VM543:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at <anonymous>:2:13070
    at <anonymous>:2:331
    at d (<anonymous>:2:6141)
    at u (<anonymous>:2:6153)
    at <anonymous>:2:6321
    at <anonymous>:2:2895
    at n.timeout (<anonymous>:2:5652)
```

**Error inti (root cause kemungkinan besar ada di sini):**
```
api/expenses:1 Failed to load resource: the server responded with a status of 422 ()
api/expenses:1 Failed to load resource: the server responded with a status of 422 ()

page-c2b8fef36ed1fa9b.js:1 POST https://coaltrade.gamblingslayer.site/api/expenses/ocr 500 (Internal Server Error)
    M @ page-c2b8fef36ed1fa9b.js:1
    i8 @ 4bd1b696-182b6b13bdad92e3.js:1
    (anonim) @ 4bd1b696-182b6b13bdad92e3.js:1
    nz @ 4bd1b696-182b6b13bdad92e3.js:1
    sn @ 4bd1b696-182b6b13bdad92e3.js:1
    cc @ 4bd1b696-182b6b13bdad92e3.js:1
    ci @ 4bd1b696-182b6b13bdad92e3.js:1

VM580:1 Uncaught (in promise) SyntaxError: Failed to execute 'json' on 'Response':
Unexpected end of JSON input (at VM580:1:1)
    at M (page-c2b8fef36ed1fa9b.js:1:2971)
    M @ page-c2b8fef36ed1fa9b.js:1
    await in M
    i8 @ 4bd1b696-182b6b13bdad92e3.js:1
    ... (call stack sama seperti di atas)

page-87a7861bad52fe08.js:1 POST https://coaltrade.gamblingslayer.site/api/expenses 422 (Unprocessable Content)
    l @ page-87a7861bad52fe08.js:1
    post @ page-87a7861bad52fe08.js:1
    mutationFn @ page-c2b8fef36ed1fa9b.js:1
    fn @ layout-254c7c3ae539628b.js:1
    b @ 5854-4855e62560781c6a.js:1
    start @ 5854-4855e62560781c6a.js:1
    execute @ layout-254c7c3ae539628b.js:1
    await in execute
    mutate @ 77-e2517b7b5c7da894.js:1
    (anonim) @ 77-e2517b7b5c7da894.js:1
    (anonim) @ page-c2b8fef36ed1fa9b.js:1
    (anonim) @ 1969-748fe57874dbd14a.js:1
    await in (anonim)
    i8 @ 4bd1b696-182b6b13bdad92e3.js:1
    (anonim) @ 4bd1b696-182b6b13bdad92e3.js:1
    nz @ 4bd1b696-182b6b13bdad92e3.js:1
    sn @ 4bd1b696-182b6b13bdad92e3.js:1
    cc @ 4bd1b696-182b6b13bdad92e3.js:1
    ci @ 4bd1b696-182b6b13bdad92e3.js:1
```
> Blok error `POST /api/expenses → 422` dengan call stack persis seperti di atas (mulai dari bundle `page-87a7861bad52fe08.js`) **berulang 3 kali** di console — kemungkinan besar karena retry otomatis dari mutation library (terlihat dari nama fungsi `mutate`, `mutationFn`, `execute` — pola khas React Query / TanStack Query).

Setelahnya muncul blok ColorScanner lain (319 elements, dengan detail warna oklch — tetap noise dari extension), lalu diikuti **pola error yang sama tapi dari bundle berbeda** (`page-c2b8fef36ed1fa9b.js` alih-alih `page-87a7861bad52fe08.js`), yaitu:
```
page-c2b8fef36ed1fa9b.js:1 POST https://coaltrade.gamblingslayer.site/api/expenses 422 (Unprocessable Content)
    i @ page-c2b8fef36ed1fa9b.js:1
    post @ page-c2b8fef36ed1fa9b.js:1
    mutationFn @ page-c2b8fef36ed1fa9b.js:1
    fn @ page-c2b8fef36ed1fa9b.js:1
    b @ 5854-4855e62560781c6a.js:1
    start @ 5854-4855e62560781c6a.js:1
    execute @ page-c2b8fef36ed1fa9b.js:1
    await in execute
    mutate @ page-c2b8fef36ed1fa9b.js:1
    (anonim) @ page-c2b8fef36ed1fa9b.js:1 (x2)
    (anonim) @ 1969-748fe57874dbd14a.js:1
    await in (anonim)
    i8 / (anonim) / nz / sn / cc / ci @ 4bd1b696-182b6b13bdad92e3.js:1
```
Blok ini (POST `/api/expenses` 422 dari bundle `page-c2b8fef36ed1fa9b.js`) juga berulang beberapa kali, diselingi dengan pengulangan blok `POST /api/expenses/ocr 500` dan `VM726:1 Uncaught SyntaxError: Unexpected end of JSON input` (sama persis polanya dengan `VM580` di atas, hanya beda nomor VM instance).

**Kesimpulan teknis untuk bug ini:**
- Ada **dua** file bundle frontend berbeda yang sama-sama memanggil `POST /api/expenses` dan sama-sama mendapat `422 Unprocessable Content` — kemungkinan dua tempat kode (draft save vs submit, atau form lama vs baru) memanggil endpoint yang sama dengan payload yang ditolak backend validation.
- `POST /api/expenses/ocr` selalu balas `500 Internal Server Error` dengan **body kosong**, sehingga saat frontend mencoba `response.json()`, terjadi `SyntaxError: Unexpected end of JSON input` — perlu perbaikan baik di endpoint OCR (kenapa 500 & body kosong) maupun di frontend (harus handle response gagal tanpa crash saat parsing JSON).

---

## 3.3 ⚖️ Outstanding Payment Dispute Status

**Tujuan:** Tandai payment yang bermasalah (disputed, under review)

**Hasil Test:**

> ⚠️ **Seluruh baris di tabel ini statusnya masih checkbox kosong (`☐ Smooth` / `☐ Bermasalah`, tidak ada yang dicentang) di dokumen asli.** Ini berbeda dari section lain yang statusnya sudah terisi teks. Kemungkinan besar section ini **belum benar-benar dites secara tuntas / hasilnya belum dicatat oleh tester** — bukan berarti semuanya "Smooth".

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Buka Outstanding Payment | [Status belum diisi] |
| 2 | Tambah payment baru | [Status belum diisi] |
| 3 | Temukan field "Dispute Status" (terlihat jelas?) | [Status belum diisi] |
| 4 | Pilih "None" -> Simpan | [Status belum diisi] |
| 5 | Edit payment -> Ubah ke "Disputed" -> Simpan | [Status belum diisi] |
| 6 | Reload -> Status masih "Disputed"? | [Status belum diisi] |
| 7 | Ubah ke "Under Review" -> Simpan | [Status belum diisi] |
| 8 | Filter payment by dispute status (jika ada) -> Bekerja? | [Status belum diisi] |

**Pengalaman yang Baik (target desain):**
- Field tidak tersembunyi (mudah ditemukan di form)
- Options jelas: None / Disputed / Under Review
- Dispute status terlihat di list payment (color coded)
- Filter/sort by dispute status memudahkan tracking

**Bug / Catatan Masalah:** Tercatat "Tidak ada error dari console" — namun mengingat status di atas belum diisi, sebaiknya fitur ini **dites ulang** untuk memastikan.

---

## 3.4 📋 Forecast Document Templates

**Tujuan:** Pilih template dokumen sesuai tipe forecast (Export/Domestic/Spot)

**Hasil Test:**

> ⚠️ Sama seperti section 3.3, **seluruh baris tabel ini checkbox-nya masih kosong** di dokumen asli — kemungkinan besar **belum dites tuntas / hasil belum dicatat**.

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Buat forecast baru | [Status belum diisi] |
| 2 | Temukan dropdown "Document Template" | [Status belum diisi] |
| 3 | Pilih "Export Shipment" -> Checklist 11 item muncul? (a-k) | [Status belum diisi] |
| 4 | Centang item "a" (LAPORAN HASIL VERIFIKASI) -> Simpan draft | [Status belum diisi] |
| 5 | Edit forecast -> Checkbox masih tercentang? | [Status belum diisi] |
| 6 | Ubah template ke "Domestic Delivery" -> Checklist berubah? (5 items) | [Status belum diisi] |
| 7 | Pilih "Spot Purchase" -> Checklist berubah lagi? (5 items) | [Status belum diisi] |
| 8 | Submit forecast -> Checklist tersimpan ke database | [Status belum diisi] |

**Pengalaman yang Baik (target desain):**
- Template selector terlihat jelas di form
- Checklist items relevan dengan tipe template
- Checkbox state tersimpan (tidak reset)
- Progress checklist terlihat (contoh: 3/11 completed)

**Bug / Catatan Masalah:** Tercatat "Tidak ada error dari console" — namun sebaiknya **dites ulang** karena status belum diisi.

---

## 3.5 📊 Market Price History Detail

**Tujuan:** Expand row untuk lihat detail snapshot semua indeks harga

**Hasil Test:**

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Buka Market Price | Smooth |
| 2 | Scroll ke "Price History" table | Smooth |
| 3 | Temukan tombol expand (chevron) di row mana saja | Smooth |
| 4 | Klik expand -> Section detail muncul? | Smooth |
| 5 | Expanded section menampilkan: Record Info (ID, Created date), Source, Action, Actor, Notes (jika ada), Full Snapshot (grid 6 kolom dengan 12 indeks) | Smooth |
| 6 | Semua indeks terlihat? (ICI1-5, Newcastle, HBA, HBA I-III, MGO, USD/IDR) | Smooth |
| 7 | Klik collapse -> Row tertutup? | Smooth |
| 8 | Expand row lain -> Data benar? | Smooth |

**Pengalaman yang Baik:**
- Expand icon jelas (arrow down/up)
- Expanded area tidak terlalu lebar (scroll horizontal minimal)
- Grid layout rapi (6 kolom mudah dibaca)
- Collapse mudah (klik chevron lagi atau area lain)

**Bug / Catatan Masalah:** Tidak ada error dari console. **Fitur ini bekerja dengan baik (fully smooth).**

---

# PHASE 4: FITUR ADVANCED (3 Fitur)

## 4.1 🎥 Meetings Video MOM Tab

**Tujuan:** Upload video meeting untuk auto-generate Minutes of Meeting (placeholder)

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Buka Meetings -> Detail meeting | Smooth | - |
| 2 | Temukan tab "Video MOM" (terlihat di tab bar?) | Smooth | - |
| 3 | Klik tab -> Halaman muncul tanpa error? | Smooth | - |
| 4 | Lihat warning: "Requires Flask MOM processor at localhost:8080" | [Status belum diisi] | Checkbox tidak dicentang (tulisan terpotong "☐ Smooth ☐ Bermasa..." di dokumen asli) |
| 5 | File input untuk video terlihat? | **Bermasalah** | Tidak ada (form input file untuk video tidak tersedia di tab ini) |
| 6 | Pilih video file -> Alert muncul dengan instruksi? | Partial | Jika import **audio** di MOM, video masih ter-*allow* tapi kena error 500. Kalau di tab **Video** sendiri belum bisa dicoba karena form input-nya belum ada |
| 7 | Instruksi jelas untuk next steps? | Smooth | - |

**Pengalaman yang Baik:**
- Tab struktur sudah siap (tidak error)
- Warning jelas bahwa fitur masih placeholder
- Instruksi integrasi Flask mudah dipahami
- UI tidak crash saat klik

**Bug / Catatan Masalah:**
```
content.js:812 CSS Inspector content script initialized
... (noise browser extension, 251 elements discan, 13 warna ditemukan — diabaikan) ...
```

**Error backend (inti masalah):**
```
api/meetings/d72c3039-1158-478b-aae8-67716b55b958/transcribe:1
Failed to load resource: the server responded with a status of 500 ()
(muncul 2x)

api/meetings/d72c3039-1158-478b-aae8-67716b55b958/extract-tasks:1
Failed to load resource: the server responded with a status of 500 ()
(muncul 2x)
```
> Endpoint `transcribe` dan `extract-tasks` untuk meeting id `d72c3039-1158-478b-aae8-67716b55b958` sama-sama mengembalikan `500 Internal Server Error`. Ditambah tidak adanya form input file video, fitur "Video MOM" ini praktis belum bisa dipakai sama sekali — konsisten dengan namanya sebagai "(placeholder)" di tujuan fitur.

---

## 4.2 🤖 AI Agent Shipment/Source Context

**Tujuan:** AI Agent punya context lengkap tentang shipment, delivery, source

**Hasil Test:**

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | (Test via API atau frontend AI Agent jika sudah dibuat) | Smooth | - |
| 2 | Tanya: "How many shipments?" -> AI jawab dengan data shipment? | Partial | Sudah muncul jawaban, tapi datanya tidak benar (beda dengan dashboard) — tapi dashboard-nya sendiri juga error (masa 6 total shipment) |
| 3 | Tanya: "Show me sources" -> AI jawab dengan data sources? | Smooth | - |
| 4 | Tanya: "List deliveries" -> AI jawab dengan delivery log? | Smooth | - |
| 5 | Tanya pertanyaan generic -> AI kasih summary stats? | **Bermasalah** | Ketik "HALO" saja, fallback jawabannya: *"📊 Based on your question about "TEST": Summary: 1151 shipments, 164 delivery logs, 10 forecast projects, 15 coal sources in system."* (fallback tidak relevan dengan pertanyaan) |

**Pengalaman yang Baik:**
- AI context mencakup 4 workbooks (Shipment, Delivery, Forecast, Sources)
- Jawaban AI relevan dan akurat
- Response time cepat (<5 detik)
- Tidak perlu tanya berulang untuk data yang sama

**Bug / Catatan Masalah — PENTING, berdasarkan 3 screenshot chat AI Agent:**

**⚠️ Temuan paling penting: AI Agent masih berjalan dalam "stub mode".** Di beberapa jawaban AI, muncul catatan kecil bertuliskan:
> "⚠ This is a stub response. Groq AI integration is pending. Add `GROQ_API_KEY` to enable real AI answers."

Artinya **jawaban AI Agent saat ini bukan hasil LLM sungguhan**, melainkan response hardcoded/template, karena environment variable `GROQ_API_KEY` belum di-set di backend. Semua evaluasi "relevan/tidak relevan" jawaban AI di bawah ini harus dipahami dalam konteks ini.

Detail percakapan yang terekam di screenshot:

1. Pesan pembuka AI Agent: *"Halo! Saya CoalTrade AI Agent. Tanyakan apapun tentang data shipment, delivery, atau forecast sales."* — dengan badge "Mode stub aktif — Groq AI integration pending."

2. **Q: "Siapa buyer terbesar berdasarkan volume?"**
   **A:** *"Top buyers by total final quantity: 1. HD — 0 MT, 2. KRL — 0 MT, 3. CFTEC — 0 MT, 4. QPPL — 0 MT, 5. OSS — 0 MT"*
   → **Bug data:** semua buyer menunjukkan volume **0 MT**, padahal seharusnya ada angka real. Kemungkinan bug di query/aggregation total quantity per buyer (bukan masalah stub AI, karena ini murni angka dari database).

3. **Q: "Tampilkan breakdown status shipment"**
   **A:** *"Shipment count by status: cancelled: 10, completed: 930, upcoming: 206, loading: 3, in_transit: 2"*
   → Jawaban ini terlihat masuk akal/benar (total = 1151, cocok dengan angka summary lain).

4. **Q: "Berapa total BL di delivery log?"**
   **A:** Alih-alih menjawab dengan angka total, AI malah men-dump **raw JSON mentah** dari beberapa record delivery log terbaru (30 terakhir), contoh:
   ```json
   {
     "id": "cmnvzxgoe000xd9l29jiq8o8b",
     "blDate": "2026-04-12T00:00:00.000Z",
     "buyer": "Wilmar",
     "supplier": "",
     "shippingTerm": "CIF-B",
     "area": "Kalteng",
     "flow": "FRI-MSE-WNI",
     "blQty": 7710.62,
     "invoiceAmount": null,
     "product": "5800 GAD",
     "projectName": "Wilmar DM 4_Jul_25",
     "createdAt": "2026-04-12T16:46:43.118Z",
     "updatedAt": "2026-04-12T16:46:43.118Z"
   },
   {
     "id": "cmnvzxh43000yd9l2ggrv30q6",
     ...
   }
   ```
   dengan catatan "(truncated — full data available in module)".
   → **Bug:** pertanyaan "berapa **total** BL" seharusnya dijawab dengan satu angka agregat (SUM), bukan daftar record mentah satu per satu. Ini menunjukkan stub response-nya belum punya logic aggregation untuk pertanyaan jenis "total/berapa banyak", hanya bisa dump raw data.

5. **Q: "Forecast project apa yang sedang waiting approval?"**
   **A:** *"Forecast Projects (latest 20):"* diikuti dump JSON array, contoh:
   ```json
   [
     {
       "projectName": "RakhaFR's Project",
       "buyer": "FRFE",
       "buyerCountry": "as",
       "quantity": 45555,
       "status": "deal",
       "laycanStart": "2026-07-26T00:00:00.000Z",
       "laycanEnd": "2026-07-31T00:00:00.000Z"
     },
     {
       "projectName": "RR",
       "buyer": "GWEU",
       "buyerCountry": "s",
       "quantity": 83999.99,
       "status": "deal",
       "laycanStart": "2026-07-28T00:00:00.000Z",
       "laycanEnd": "2026-08-08T00:00:00.000Z"
     }
   ]
   ```
   → **Bug filter:** user bertanya spesifik status **"waiting approval"**, tapi jawaban AI menampilkan project dengan `status: "deal"` (bukan status waiting/pending) — filter status tidak diterapkan, AI hanya menampilkan 20 project terbaru apa adanya tanpa memfilter sesuai pertanyaan.

```
content.js:812 CSS Inspector content script initialized
... (noise browser extension, 312 elements — diabaikan, muncul 2x di section ini) ...
```

**Catatan tester:** "MUNGKIN DATA DARI DASHBOARD BELUM SINKRON" — dugaan tester bahwa sumber data AI Agent dan Dashboard belum konsisten satu sama lain.

```
VM839:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at <anonymous>:2:13070
    at <anonymous>:2:331
    at d (<anonymous>:2:6141)
    at u (<anonymous>:2:6153)
    at <anonymous>:2:6321
    at <anonymous>:2:2895
    at n.timeout (<anonymous>:2:5652)
```
*(muncul 2x berturut-turut, identik)*

---

## 4.3 📄 Forecast SI Generation

**Tujuan:** Generate PDF Shipping Instruction dari forecast approved/deal

**Hasil Test:**

| No | Skenario User | Status QA |
|----|----------------|-----------|
| 1 | Buka forecast dengan status "Approved" atau "Deal" | Smooth |
| 2 | Temukan tombol "Generate SI" (mudah ditemukan?) | Smooth |
| 3 | Klik tombol -> PDF download otomatis? | Smooth |
| 4 | Buka PDF (nama file: SI-{projectName}.pdf) | Smooth |
| 5 | PDF berisi: Header "SHIPPING INSTRUCTION", SI Number, TO: PT. FONTANA RESOURCES INDONESIA, Project Name, Shipper/Consignee/Notify Party, Quantity/Nomination/Loading Port/Discharge Port, Laycan, Shipping Term, Coal Specification (jika ada), Analysis Method, Marked text | Smooth |
| 6 | Generate dari forecast lain -> SI number unique? | Smooth |
| 7 | Format PDF professional? (bisa langsung dikirim ke partner) | Smooth |

**Pengalaman yang Baik:**
- Tombol hanya muncul untuk status approved/deal (tidak semua forecast)
- PDF generate instant (tidak perlu tunggu lama)
- Layout PDF rapi dan professional
- Semua field terisi lengkap (tidak ada [undefined])

**Bug / Catatan Masalah:** Fitur ini **fully smooth** menurut tabel hasil test. Namun di console tetap tercatat noise/error umum berikut (kemungkinan tidak spesifik untuk fitur ini, muncul di banyak halaman):
```
content.js:812 CSS Inspector content script initialized
... (noise browser extension, 312 elements — diabaikan) ...

VM839:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at <anonymous>:2:13070
    at <anonymous>:2:331
    at d (<anonymous>:2:6141)
    at u (<anonymous>:2:6153)
    at <anonymous>:2:6321
    at <anonymous>:2:2895
    at n.timeout (<anonymous>:2:5652)
```
*(blok error yang sama muncul 2x berturut-turut)*

---

# PENGALAMAN KESELURUHAN SISTEM

### Navigasi & Layout

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Menu navigasi mudah dipahami (tidak perlu training) | Partial | "TENTU PERLU, YANG QA AJA KEBINGUNGAN SAMA DEV-NYA" |
| 2 | Breadcrumb membantu tahu posisi di sistem | Smooth | - |
| 3 | Search global bekerja (temukan data cepat) | **Bermasalah** | "TIDAK!! BENERIN SEMUANYA URGENT BANGET" |
| 4 | Responsive di tablet/mobile? (jika diakses dari HP) | Partial | Ada yang responsif, ada juga yang tidak — perlu AI agent melakukan pengecekan penuh |

### Performance

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Halaman load cepat (<3 detik) | Smooth | - |
| 2 | Tidak ada lag saat klik button | Smooth | Disarankan AI agent tetap mencari kemungkinan lag tersembunyi dan menstandarkan/optimasi |
| 3 | Filter dan search instant | Partial | Tidak semuanya — kadang masih melempar data yang tidak akurat/sesuai |
| 4 | Tidak ada freeze/hang saat input data | Smooth | - |

### Konsistensi UI

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Button style konsisten (primary, secondary, danger) | Smooth | - |
| 2 | Form layout konsisten di semua modul | Partial | Kadang beberapa kolom input text tidak center secara vertikal (sumbu Y) |
| 3 | Modal/drawer style seragam | Smooth | - |
| 4 | Color coding logis (hijau = sukses, merah = danger, kuning = warning) | Smooth | - |

### Error Handling

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | Error message jelas dan membantu (bukan "Error 500") | Partial | Kadang error message jelas, kadang cuma pakai error code — disarankan AI agent mengecek penuh seluruh file agar pesan error diganti supaya tidak menampilkan kode error mentah ke user |
| 2 | Validation message muncul di field yang salah | Smooth | - |
| 3 | Tidak ada crash tanpa pesan error | Smooth | - |
| 4 | Ada cara untuk recover dari error (refresh, back button) | Smooth | - |

### Onboarding

| No | Skenario User | Status QA | Catatan Tester |
|----|----------------|-----------|-----------------|
| 1 | User baru bisa paham sistem tanpa tutorial panjang? | Partial | "Tidak juga, tergantung orangnya" |
| 2 | Tooltip/hint membantu di fitur kompleks? | Partial | Belum sepenuhnya — sebaiknya diberi tooltip modern, bukan yang terkesan "AI slop" |
| 3 | Empty state jelas (ketika belum ada data, ada instruksi apa yang harus dilakukan) | **Bermasalah** | Kadang masih ada input aneh yang tetap lolos — sebaiknya state HTML-nya diberi `htmlspecialchars`/sanitasi yang disesuaikan dengan kondisinya (indikasi potensi celah input validation/XSS-related sanitization) |

---

# CATATAN UMUM & FEEDBACK

**Apa yang Paling Membantu:**
> Memudahkan tracking dan simulasi dan automation report.

**Apa yang Paling Membingungkan:**
> Hampir semuanya perlu training lagi, tester QA pun (masih bingung).

**Fitur yang Sering Digunakan:**

*Commercial*
- [Market Price](https://coaltrade.gamblingslayer.site/market-price)
- [Forecast Sales](https://coaltrade.gamblingslayer.site/forecast-sales)
- [Sales Monitor](https://coaltrade.gamblingslayer.site/sales-monitor)

*Operations*
- [Shipment Monitor](https://coaltrade.gamblingslayer.site/shipment-monitor)
- [Sources & Supplier](https://coaltrade.gamblingslayer.site/sources)
- [Blending Simulator](https://coaltrade.gamblingslayer.site/blending)

*Finance*
- [Outstanding Payment](https://coaltrade.gamblingslayer.site/outstanding-payment)
- [Profit & Loss](https://coaltrade.gamblingslayer.site/profit-loss)
- [Expenses](https://coaltrade.gamblingslayer.site/purchase-requests)

*Collaboration*
- [Meetings](https://coaltrade.gamblingslayer.site/meetings)
- [Tasks](https://coaltrade.gamblingslayer.site/all-tasks)
- [AI Agent](https://coaltrade.gamblingslayer.site/ai-agent)

*Approvals*
- [Approval Center](https://coaltrade.gamblingslayer.site/approval-center)

*Administration*
- [Production Readiness](https://coaltrade.gamblingslayer.site/production-readiness)
- [Users](https://coaltrade.gamblingslayer.site/users)

**Fitur yang Jarang/Tidak Digunakan:**
> Mungkin semuanya bakal berguna, belum terlihat saja (belum ada fitur yang secara eksplisit dianggap tidak berguna).

**Saran Perbaikan (kutipan langsung dari tester):**
> "PERBAIKAN YANG SANGAT KRUSIAL BAGI PENGGUNA YANG AKAN MEMAKAI APLIKASI INI, ATASI ERROR SEPERTI FORM INPUT DAN EXPORT FILE FILE DOKUMEN DAN TAMPILAN DETAIL INFORMASI PADA DETAIL MODAL"

Ringkasan saran: prioritaskan perbaikan (1) error pada form input di berbagai modul, (2) fitur export/download dokumen, dan (3) tampilan detail informasi pada modal detail (mis. Deal Detail Modal yang tidak terbuka).

---

# SIGN-OFF

- **Tested By:** Rakha FR
- **Role:** QA Tester
- **Date:** 26/08/2026
- **Overall Experience (1–10):** 3/10
- **Ready to Use Daily:** No
- **Keputusan:** (opsi di dokumen asli, tidak ada yang secara eksplisit ditandai/dicentang oleh tester — kemungkinan besar mengarah ke opsi ketiga mengingat skor 3/10 dan banyaknya "Bermasalah")
  - ☐ Siap production (smooth, tidak ada blocker)
  - ☐ Perlu perbaikan kecil (usable, tapi ada minor issue)
  - ☐ Perlu perbaikan besar (banyak masalah UX)

*Generated: 2026-07-26 | Focus: User Experience & Usability Testing*

---

## LAMPIRAN — Daftar Endpoint/Error Unik yang Tercatat (untuk quick-reference debugging)

| Endpoint / Error | Status Code | Muncul di Fitur |
|---|---|---|
| `POST /api/forecasts/{id}/generate-fco` | 409 | 1.1 Forecast Buyer Feedback |
| `POST /api/market-scrape` | 403 Forbidden | 1.1, 1.4 |
| `POST /api/expenses` | 422 Unprocessable Content | 3.2 Expense Anomaly (berulang, 2 bundle JS berbeda) |
| `POST /api/expenses/ocr` | 500 Internal Server Error (body kosong → memicu `SyntaxError` di frontend) | 3.2 Expense Anomaly |
| `POST /api/meetings/{id}/transcribe` | 500 Internal Server Error | 4.1 Meetings Video MOM |
| `POST /api/meetings/{id}/extract-tasks` | 500 Internal Server Error | 4.1 Meetings Video MOM |
| `Minified React error #418` (kemungkinan hydration mismatch) | JS Uncaught Error | 2.4 Blending Report Export |
| `Cannot read properties of undefined (reading 'startTime')` at `et.reportAllChanges` | JS Uncaught TypeError | Muncul berulang di banyak halaman (2.3, 3.2, 4.2, 4.3) — kemungkinan bug umum di layer performance-reporting/web-vitals, bukan spesifik satu fitur |
| `content.js` / "CSS Inspector" / "ColorScanner" logs | — | **Bukan bug aplikasi** — noise dari browser extension tester, muncul di hampir semua halaman |

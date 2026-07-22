# Modul: Market Price Index

**Route:** `/market-price`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/market-price/page.tsx) (844 baris, 56KB)  
**Store:** `commercial-store`  
**Akses:** Semua role bisa melihat; edit hanya role dengan permission `market_price_edit`  
**Dependencies:** Recharts, Groq AI (untuk scraping)

---

## Deskripsi Umum

Modul tracking harga batubara global secara real-time. Menampilkan 10 index harga (ICI 1-5, Newcastle, HBA, HBA I-III), menyediakan kalkulator harga otomatis, perbandingan harga pasar vs harga aktual deal/shipment, dan sistem auto-scraping menggunakan AI (Groq).

---

## Layout

### 1. Header
- Title: "Market Price Index"
- Badge: "🟢 Global Scraping Active" (hijau, animasi pulse)
- Subtitle: "ICI, Newcastle & HBA coal price tracking"
- Tombol **"Scraping Settings"** (hanya untuk role `market_price_edit`)

### 2. Price Cards (Grid 10 kolom)
10 kartu harga, satu per index:

| Card | Base Index | Warna |
|------|-----------|-------|
| ICI 1 (6500) | ici_1 | #ef4444 (Merah) |
| ICI 2 (5800) | ici_2 | #f59e0b (Amber) |
| ICI 3 (5000) | ici_3 | #3b82f6 (Biru) |
| ICI 4 (4200) | ici_4 | #8b5cf6 (Violet) |
| ICI 5 (3400) | ici_5 | #6366f1 (Indigo) |
| Newcastle | newcastle | #ec4899 (Pink) |
| HBA | hba | #10b981 (Emerald) |
| HBA I (5300) | hba_1 | #14b8a6 (Teal) |
| HBA II (4100) | hba_2 | #06b6d4 (Cyan) |
| HBA III (3400) | hba_3 | #0ea5e9 (Sky) |

Setiap card menampilkan:
- Label index (uppercase, kecil)
- Harga USD (bold, besar, berwarna)
- Delta perubahan: ↑ hijau (positif) / ↓ merah (negatif)

### 3. Dual Calculator Panel (Grid 2 kolom)

#### 3a. Standard Index Calculator (Violet theme)
Menentukan buying/selling price berdasarkan index pasar real-time.

| Elemen | Jenis | Detail |
|--------|-------|--------|
| Base Index | Dropdown | ICI 1-5, Newcastle, HBA, HBA I-III (dengan harga terbaru) |
| Premium/Discount | Number Input | Adjustment dalam USD (positif = premium, negatif = discount) |
| **Final Estimated Price** | Display | `BaseIndex + Adjustment` — ditampilkan besar di area violet |

Contoh: ICI 4 = $36.50, Discount = -$2.50 → Final = **$34.00**

#### 3b. HPB Estimation Calculator (Rose theme)
Estimasi Harga Patokan Batubara (HPB) berdasarkan spesifikasi kualitas aktual.

| Input | Default | Fungsi |
|-------|---------|--------|
| GAR | 4200 | Gross As Received calorie value |
| TM (%) | 35 | Total Moisture |
| TS (%) | 0.2 | Total Sulphur |
| ASH (%) | 8 | Ash content |

**Algoritma kalkulasi:**
1. Pilih tier HBA terdekat berdasarkan GAR input:
   - HBA (6322), HBA I (5300), HBA II (4100), HBA III (3400)
2. Base price = `(GAR / closestTier.GAR) × closestTier.HBA`
3. Adjustment per spec:
   - TM: `(tmDiff × -0.01) × basePrice`
   - ASH: `(ashDiff × -0.005) × basePrice`
   - TS: `(tsDiff × 10 × -0.01) × basePrice`
4. Final HPB = `max(0, basePrice + tmAdj + ashAdj + tsAdj)`

### 4. Market vs Sales and Purchase Comparison

| Elemen | Detail |
|--------|--------|
| Index Selector | Dropdown: ICI 1-5, Newcastle, HBA |
| Summary Cards (4) | Selected Market, Avg Sell Spread, Avg Buy Spread, Compared Rows |

**Comparison Table:**

| Kolom | Deskripsi |
|-------|-----------|
| Type | Sales / Purchase / Supplier FOB / PL Sell / PL Buy |
| Name | Buyer/supplier/deal name |
| Qty | Kuantitas |
| Price | Harga per MT (USD) |
| Spread | `Price - SelectedMarketIndex` (hijau jika positif untuk sell, merah jika negatif) |
| Note | Tipe deal, region, atau status |

Data diambil dari 4 sumber:
1. **Deals** (sales-monitor) → tipe "Sales"
2. **Shipments** → tipe "Purchase" atau "Shipment Sale"
3. **Sources** → tipe "Supplier FOB"
4. **PL Forecasts** → tipe "PL Sell" dan "PL Buy"

Tabel diurutkan berdasarkan absolute spread terbesar, max 20 rows.

### 5. Price Trend Chart (Recharts ComposedChart)

| Elemen | Detail |
|--------|--------|
| Line: ICI 1 | Merah, strokeWidth 2 |
| Line: ICI 2 | Amber |
| Line: ICI 3 | Biru |
| Line: ICI 4 | Violet |
| Line: ICI 5 | Indigo |
| Line: Newcastle | Pink |
| Bar: HBA | Hijau transparan (fill + stroke) |

**Range Selector (3 tombol):**
- `2 Minggu` — 14 data terakhir
- `4 Minggu` — 28 data terakhir
- `Semua` — Seluruh data

### 6. Input Price Hari Ini (banner)
- Info update terakhir: waktu, oleh siapa (nama + manual/auto scrape)
- Tombol **"Input Price"** → buka form input

### 7. Input Form (inline card)
10 field input number (ICI 1-5, Newcastle, HBA, HBA I-III)
- Tombol **"Save"** dan **"Cancel"**
- Disimpan via `addMarketPrice()` dengan source = "Manual"

### 8. Price History per Entry (Expandable)
Setiap entry harga memiliki riwayat update yang bisa di-expand:
- Waktu update
- Oleh siapa (nama user / "Auto Scrape")
- Source (Manual / Argus / GlobalCoal / etc.)
- Action: `manual_update`, `auto_scrape`, `create`
- Harga per index saat update tersebut

### 9. Scraping Settings Modal

| Elemen | Detail |
|--------|--------|
| Global Status | "Global Auto-Scraping" — hijau, pulse indicator |
| Interval Dropdown | 3s (testing), 1min, 5min, 1h, **6h (default)**, 12h, Daily |
| Target Sources | Checkbox: GlobalCoal API, Argus Media, McCloskey, ICE Futures |
| Manual Fetch Logs | Terminal-like log display (hitam, mono font, scrollable) |
| "Fetch Now" | Tombol trigger manual scraping |
| "Close" | Tutup modal |

---

## Daftar Tombol dan Aksi

| Tombol | Lokasi | Aksi |
|--------|--------|------|
| "Scraping Settings" | Header | Buka modal pengaturan |
| "Input Price" | Banner | Buka form input manual |
| "Fetch Now (Manual)" | Modal | POST ke `/api/market-scrape` → Groq AI |
| "Save" | Form | Simpan harga ke database |
| "Cancel" | Form | Tutup form tanpa simpan |
| "Close" | Modal | Tutup modal |
| Range selector (2W/4W/All) | Chart | Ubah range chart |
| Index selector | Comparison | Ubah index pembanding |
| Expand/collapse | History | Toggle riwayat per entry |

---

## Grafik / Chart

| Jenis | Library | Data |
|-------|---------|------|
| ComposedChart | Recharts | Price trend (6 Line + 1 Bar) |

---

## User Flow

```
User buka /market-price
  │
  ├── Lihat harga terbaru (10 price cards)
  ├── Gunakan Standard Calculator → estimasi harga jual/beli
  ├── Gunakan HPB Calculator → estimasi HPB berdasarkan spec
  │
  ├── Comparison Table → bandingkan harga pasar vs deal aktual
  │     └── Pilih index → lihat spread per deal/shipment/source
  │
  ├── Chart → lihat trend harga (2W/4W/All)
  │
  ├── Input manual → "Input Price" → isi 10 field → Save
  │
  └── Scraping Settings
        ├── Atur interval auto-scraping
        ├── Manual fetch → "Fetch Now" → AI scraping via Groq
        └── Lihat logs
```

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Dashboard | Market Price Mini Widget menampilkan data terbaru |
| Shipment Monitor | Harga referensi untuk pricing per shipment |
| Sales Monitor | Harga referensi untuk deal pricing |
| PL Forecast | Harga referensi untuk proyeksi P&L |
| Sources | FOB Barge Price dibandingkan dengan market index |
| API `/api/market-scrape` | Endpoint scraping (Groq AI) |

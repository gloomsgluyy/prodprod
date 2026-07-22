# Modul: Profit and Loss (P&L)

**Route:** `/profit-loss`  
**File:** `src/app/profit-loss/page.tsx`  
**Store:** `sales-store` (Revenue), `purchase-store` (Expense)  
**Library:** `recharts`

---

## Deskripsi Umum

Halaman laporan keuangan tingkat atas yang menampilkan perbandingan antara pemasukan (Revenue) dari penjualan, melawan pengeluaran (Expense) dari operasional dan pembelian.

---

## Layout

### 1. Header
- Title: "Profit & Loss"
- Access Restricted banner (jika user tidak memiliki permission).

### 2. Summary Cards (Top Metrics)
Terdapat 4 kartu metrik utama di bagian atas:
- **Total Revenue**: Total nilai dari *Approved Sales*. (Warna Hijau/Emerald)
- **Total Expense**: Total nilai dari *Approved Purchase Requests*. (Warna Merah/Rose)
- **Net Profit**: Revenue dikurangi Expense.
- **Margin (%)**: Persentase margin keuntungan kotor.

### 3. Charts Area (Visualisasi)
- **Toggle Period**: Tombol opsi untuk melihat grafik dalam skala `Monthly` (Bulanan) atau `Quarterly` (Kuartalan).
- **Income vs Expense Chart (BarChart)**: 
  - Grafik batang ganda per bulan. 
  - Batang biru untuk Income/Revenue, batang merah untuk Expense.
  - Terdapat tooltip (melayang saat di-*hover*) untuk melihat nilai presisi tiap bulan.
- **Net Profit Trend (LineChart)**:
  - Grafik garis (hijau) yang menunjukkan fluktuasi Net Profit per bulan.

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Monthly / Quarterly Toggle** | Mengubah pengelompokan data pada *BarChart* dan *LineChart* |
| **Chart Hover** | Memunculkan Dialog/Tooltip berisi angka aktual (Rp/USD) di titik grafik yang disorot |

---

## User Flow

```
User buka /profit-loss
  │
  ├── Sistem mem-verifikasi permission (hanya Eksekutif yang bisa melihat).
  │
  ├── Data ditarik dari dua store berbeda: sales (pemasukan) dan purchases (pengeluaran).
  │
  ├── User melihat ringkasan (Summary Cards).
  │
  ├── User menyorot (hover) grafik batang untuk melihat bulan mana dengan pengeluaran tertinggi.
  │
  └── User dapat men-toggle view ke "Quarterly" untuk laporan kuartal.
```

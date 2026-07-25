# SRS Finalization Rewrite - CoalTrade OS

**Date:** 2026-07-24  
**Target codebase:** `C:\CoalTrade-Production`  
**Reference system:** `C:\Users\Glooms\Downloads\11GAWE`  
**Purpose:** menjadi acuan finalisasi rewrite agar fitur, workflow, dokumen, akses role, data model, dan production readiness tidak melenceng dari sistem existing yang sudah dikerjakan.



## 1. Cara Pakai Folder Ini

Folder ini dibuat khusus untuk memandu implementasi rewrite. Setiap AI/developer yang melanjutkan `C:\CoalTrade-Production` wajib membaca file berikut secara berurutan:

1. `01_MASTER_SRS_REWRITE_FINALIZATION.md`  
   SRS utama. Menjelaskan visi sistem, flow end-to-end, rule bisnis, dan definisi production grade.

2. `02_CODE_PARITY_AND_GAP_MATRIX.md`  
   Perbandingan fitur current system vs rewrite berdasarkan dokumentasi dan codebase aktual. File ini sengaja tidak percaya klaim `Done` di SRS lama jika code belum end-to-end.

3. `03_EXECUTION_BACKLOG_FOR_REWRITE.md`  
   Daftar pekerjaan yang harus dilakukan, urutan prioritas, acceptance criteria, dan file/area code yang harus diperiksa.

4. `04_MARKET_PRICE_FINALIZATION_SRS.md`  
   SRS detail khusus Market Price, termasuk update user terbaru: history sudah ada, tetapi manual input price belum tersedia/harus dipastikan berfungsi.

5. `05_PRODUCTION_GRADE_ACCEPTANCE_GATE.md`  
   Release gate sebelum rewrite boleh dianggap production grade.

6. `06_MODULE_REQUIREMENT_DEEP_DIVE.md`  
   Requirement detail per modul agar parity tidak hanya dilihat dari menu/API, tetapi dari workflow.

7. `07_REWRITE_IMPLEMENTATION_BLUEPRINT.md`  
   Blueprint teknis area code, model data, cache, UI loading, approval UX, dan urutan implementasi.

## 2. Prinsip Utama

- Jangan menganggap fitur selesai hanya karena ada endpoint, schema field, atau UI stub.
- Fitur dianggap selesai hanya jika user flow berjalan dari input, validasi, persistensi, akses role, audit, UI state, sampai output/download jika ada.
- Rewrite harus mempertahankan fitur existing yang sudah ada di `11GAWE`, bukan sekadar mengikuti docs rewrite yang banyak menandai status `Done`.
- Dokumen generated seperti SI/FCO/Summary bukan upload manual utama. Dokumen tersebut harus dibuat dari data sistem, disimpan metadata/PDF-nya, dan bisa dicari/download dari Document Drive.
- Market Price adalah reference engine untuk Forecast Sales, Sales Monitor, P&L, freight/MGO, dan warning pricing.

## 3. Status Audit Singkat

Estimasi feature parity rewrite terhadap current system saat audit ini: **sekitar 59%**.

Rewrite punya fondasi arsitektur yang lebih sehat: `src/modules`, React Query, Prisma schema, Zod, React Hook Form, API resource pattern. Namun dari sisi business workflow, current system masih lebih lengkap untuk dokumen, Forecast Sales/FCO, SI, public Document Drive, dan beberapa rule approval/audit.

## 4. Catatan Penting Market Price

Tambahan user pada 2026-07-24:

> Market price belum bisa input price, tapi history price sudah ada.

Artinya untuk rewrite, `Price History` tidak cukup. Wajib ada manual input price yang benar-benar dapat menyimpan entry baru per hari, menampilkan siapa/jam update, melakukan append history, meng-update cards/chart/reference, dan meng-invalidate cache tanpa refresh manual.

## 5. Non-Goal Dokumen Ini

Dokumen ini tidak mengubah code. Ini adalah SRS dan execution guide untuk memperjelas apa saja yang harus diubah di rewrite.

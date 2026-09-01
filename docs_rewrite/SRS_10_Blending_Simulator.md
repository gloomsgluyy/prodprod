# SRS Modul 10: Blending Simulator

**Modul:** Blending Simulator | **Route:** `/blending` | **Versi:** 2.2
**Terakhir Diperbarui:** Juli 2026
**Implementation Status:** Partial — QA fix applied for numeric live-calculation inputs; browser re-test required.

---

## 1. Overview
Simulator blending batubara untuk menghitung spesifikasi campuran dari dua atau lebih cargo. Menyediakan kalkulasi real-time (live preview), estimasi biaya dan margin blending, rekomendasi pass/warning/not recommended, simulasi resmi yang disimpan ke history, dan link ke Forecast Sales untuk dipakai dalam offer.

Blending bisa di-trigger dari tiga arah:
1. **Standalone** — user buka `/blending` langsung
2. **Dari Sales Monitor / Forecast Sales** — "Run Blending for this Deal" pre-fill spec target dari deal
3. **Dari Quality** — "Check Blend Option" pre-fill target spec dari contract spec quality record

| Store | `commercial-store` | Akses | Semua role |

---

## 2. Functional Requirements

### FR-BLD-001: Dynamic Cargo Input Table (Status: Done)
**Priority:** Medium

| Kolom | Type | Default |
|-------|------|---------|
| Cargo Name | Text | "Cargo A", "Cargo B", dst. |
| Source | Dropdown (Load from Source) | — |
| Quantity (MT) | Number | 30000, 20000 |
| GAR | Number | 4200 |
| TS (%) | Number | 0.8 |
| ASH (%) | Number | 5.0 |
| TM (%) | Number | 30 |
| FOB Barge Price (USD/MT) | Number | — (auto-fill jika Load from Source) |
| Hauling Cost (USD/MT) | Number | — (optional) |
| Cost per MT | Number | FOB + Hauling |

Per baris: Dropdown **"Load from Source"** + **Delete** button.
"Add Cargo" → tambah baris baru (Cargo C, D, dst.)

**Acceptance Criteria:**
- `AC-BLD-001`: "Load from Source" mengisi spec + harga dari Sources module
- `AC-BLD-002`: Hauling cost bisa diisi manual (override) atau auto dari Source hauling data

---

### FR-BLD-002: Live Preview (Real-time) (Status: Done)
**Priority:** Medium

Kalkulasi weighted average setiap kali input berubah:
```
totalQty = sum(cargo.quantity)
blendedGAR = round(sum(cargo.gar × cargo.quantity) / totalQty)
blendedTS  = round(sum(cargo.ts × cargo.quantity)  / totalQty, 2)
blendedASH = round(sum(cargo.ash × cargo.quantity) / totalQty, 2)
blendedTM  = round(sum(cargo.tm × cargo.quantity)  / totalQty, 2)
blendedCostPerMt = sum(cargo.costPerMt × cargo.quantity) / totalQty
totalBlendCost = sum(cargo.costPerMt × cargo.quantity)
```

Display: Total Quantity, Blended GAR, TS, ASH, TM, **Average Cost/MT**, **Total Blend Cost**.

---

### FR-BLD-003: Target Spec Comparison & Recommendation (Status: Done)
**Priority:** High

User input Target Spec (dari kontrak atau buyer requirement):

| Field | Deskripsi |
|-------|-----------|
| Target GAR | Min GAR yang dibutuhkan buyer |
| Max TS (%) | Batas maksimal Total Sulphur |
| Max ASH (%) | Batas maksimal Ash |
| Max TM (%) | Batas maksimal Total Moisture |
| Target Sell Price (USD/MT) | Harga jual yang diinginkan |

Sistem membandingkan **Blended spec vs Target spec** dan menampilkan:

| Hasil | Kondisi | Warna |
|-------|---------|-------|
| **✅ PASS** | Semua parameter memenuhi target | Hijau |
| **⚠️ WARNING** | Satu atau lebih parameter mendekati batas (<5% dari batas) | Kuning |
| **❌ NOT RECOMMENDED** | Satu atau lebih parameter melewati batas | Merah |

**Acceptance Criteria:**
- `AC-BLD-003`: Recommendation otomatis dihitung saat spec dan target diisi
- `AC-BLD-004`: Detail per parameter: nilai blended vs target + status (pass/warning/fail)

---

### FR-BLD-004: Margin Estimation (Status: Done)
**Priority:** High

Estimasi margin dari blend scenario.

| Field | Formula |
|-------|---------|
| Average Buy Cost (USD/MT) | Blended cost per MT (weighted average) |
| Freight Estimate (USD/MT) | Input manual (referensi dari Transshipment/Market) |
| Other Cost (USD/MT) | Input manual (royalti, PBM, dll.) |
| Estimated Total Cost | Buy Cost + Freight + Other |
| Target Sell Price | Input dari user |
| Estimated Margin (USD/MT) | Sell - Total Cost |
| Estimated Total Margin (USD) | Margin/MT × Total Qty |
| Market Reference (USD/MT) | Auto-pull dari Market Price (ICI/HBA terdekat berdasarkan GAR) |
| Margin vs Market | Sell - Market Reference |

**Business Rules:**
- `BR-BLD-001`: Jika Estimated Margin < 0, tampilkan alert "Negative Margin"
- `BR-BLD-002`: Jika Estimated Sell < Market Reference by >10%, tampilkan warning "Harga di bawah market"
- `BR-BLD-003`: Margin estimation hanya estimasi — tidak otomatis masuk ke P&L

**Acceptance Criteria:**
- `AC-BLD-005`: Margin dihitung otomatis saat semua input terisi
- `AC-BLD-006`: Alert Negative Margin tampil jelas
- `AC-BLD-007`: Market reference diambil dari Market Price module (latest)

---

### FR-BLD-005: Simulate Blend (Official Save) (Status: Done)
**Priority:** Medium

"Simulate Blend" → jalankan kalkulasi resmi dan simpan ke history.
Result Card: Final spec, recommendation (PASS/WARNING/NOT RECOMMENDED), margin estimation, comparison vs target.
Hanya aktif jika user terautentikasi.

---

### FR-BLD-006: Blending History (Status: Done)
**Priority:** Low

Riwayat: tanggal, input cargoes, hasil spec, recommendation, margin estimate, user yang jalankan.

---

### FR-BLD-007: Load from Source (Status: Done)
**Priority:** Medium

Dropdown pilih supplier → otomatis isi spec (GAR, TS, ASH, TM) dan harga FOB dari Sources module.
Jika source memiliki data hauling, hauling cost juga otomatis terisi.

---

### FR-BLD-008: Entry Point dari Sales Monitor / Forecast Sales (Status: Done — /api/blending/prefill?dealId= and ?projectId=)
**Priority:** High

User di halaman Sales Monitor atau Forecast Sales bisa langsung trigger Blending Simulator dengan context deal yang sudah terisi.

**Trigger:** Tombol **"Run Blending Scenario"** di:
- Sales Monitor → Deal Detail Modal (tab Info)
- Forecast Sales → Project Detail Panel (sudah ada embedded blending — ini adalah deep-link ke standalone page)

**Behaviour saat deep-link:**
- URL: `/blending?dealId=xxx` atau `/blending?projectId=xxx`
- Target spec (GAR, TS, ASH, TM, sell price) otomatis pre-fill dari deal/project yang dipilih
- `linkedForecastSalesId` atau `linkedDealId` otomatis terisi di simulasi
- Setelah simulate & save, user bisa klik **"Use this Result in Deal"** → update `blendingScenario` di project/deal

**Data yang di-pass dari Sales Monitor:**
| Field | Source di Deal |
|-------|---------------|
| Target GAR | `specGar` |
| Max TS | `specTs` |
| Max ASH | `specAsh` |
| Max TM | `specTm` |
| Target Sell Price | `pricePerMt` |

**Business Rules:**
- `BR-BLD-004`: Deep-link hanya pre-fill target spec — cargo rows tetap kosong, user isi sendiri
- `BR-BLD-005`: Simulasi yang di-save dari context deal otomatis menyimpan `linkedDealId` atau `linkedForecastSalesId`
- `BR-BLD-006`: "Use this Result" hanya update `blendingScenario` field di project — tidak overwrite spec kontrak

**Acceptance Criteria:**
- `AC-BLD-008`: Buka `/blending?projectId=xxx` → target spec terisi otomatis dari project
- `AC-BLD-009`: "Use this Result in Deal" tombol muncul jika simulasi dibuka dari context deal/project
- `AC-BLD-010`: Simulasi tersimpan dengan referensi ke project/deal asal

---

### FR-BLD-009: Entry Point dari Quality Control (Status: Done — /api/blending/prefill?qualityId=, only for warning/need_review/claim_potential)
**Priority:** High

User di halaman Quality bisa trigger Blending Simulator untuk mencari kombinasi cargo yang bisa memenuhi contract spec ketika kualitas aktual sedang warning atau di bawah spec.

**Trigger:** Tombol **"Check Blend Option"** di:
- Quality → Record detail dengan status `warning`, `need_review`, atau `claim_potential`

**Behaviour saat deep-link:**
- URL: `/blending?qualityId=xxx`
- Target spec otomatis pre-fill dari `contractSpec` di quality record
- Label context muncul di atas simulator: *"Checking blend option for: [Cargo Name] — Contract Spec: GAR [x], TS [x]%..."*
- `linkedQualityId` disimpan saat simulate & save

**Data yang di-pass dari Quality:**
| Field | Source di QualityResult |
|-------|------------------------|
| Target GAR | `contractSpec.gar` |
| Max TS | `contractSpec.ts` |
| Max ASH | `contractSpec.ash` |
| Max TM | `contractSpec.tm` |
| Context Label | `cargoName` |

**Business Rules:**
- `BR-BLD-007`: Deep-link dari Quality hanya tersedia untuk status `warning`, `need_review`, `claim_potential` — bukan `passed` atau `rejected`
- `BR-BLD-008`: Simulasi yang di-save dari context quality menyimpan `linkedQualityId`
- `BR-BLD-009`: Hasil simulasi tidak otomatis mengubah status quality — hanya sebagai referensi opsi blending

**Acceptance Criteria:**
- `AC-BLD-011`: Tombol "Check Blend Option" hanya muncul di quality records dengan status warning/need_review/claim_potential
- `AC-BLD-012`: Buka `/blending?qualityId=xxx` → target spec terisi dari contractSpec quality record
- `AC-BLD-013`: Context label tampil jelas menunjukkan simulasi ini terkait cargo mana

---

## 3. Data Model

### Entity: BlendingSimulation
| Field | Type | Keterangan |
|-------|------|------------|
| id | UUID | |
| cargoes | JSON | Array: {name, sourceId, qty, gar, ts, ash, tm, fobPriceUsd, haulingCostUsd} |
| result | JSON | {blendedGAR, blendedTS, blendedASH, blendedTM, avgCostPerMt, totalCost} |
| targetSpec | JSON | {minGAR, maxTS, maxASH, maxTM, targetSellPrice} |
| recommendation | Enum | pass / warning / not_recommended |
| marginEstimate | JSON | {freightEst, otherCost, estimatedMarginPerMt, estimatedTotalMargin, marketRef} |
| linkedForecastSalesId | FK | Optional — jika dibuka dari Forecast Sales |
| **linkedDealId** | FK | Optional — jika dibuka dari Sales Monitor deal |
| **linkedQualityId** | FK | Optional — jika dibuka dari Quality record |
| userId | FK | User yang run simulasi |
| createdAt | DateTime | |

---

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| POST | `/api/blending/simulate` |
| GET | `/api/blending/history` |
| GET | `/api/blending/history/:id` |
| **GET** | **`/api/blending/prefill?projectId=`** (pre-fill target spec dari Forecast Sales) |
| **GET** | **`/api/blending/prefill?dealId=`** (pre-fill target spec dari Sales Monitor deal) |
| **GET** | **`/api/blending/prefill?qualityId=`** (pre-fill target spec dari Quality contract spec) |
| **POST** | **`/api/blending/:id/link-deal`** (link simulasi ke deal setelah "Use this Result") |

## 5. Integration Points
| Modul | Hubungan |
|-------|----------|
| Sources | Load spec + harga FOB + hauling cost dari supplier |
| Market Price | Market reference price (ICI/HBA) untuk margin vs market comparison |
| Forecast Sales | Blending scenario embedded per project; hasil blend bisa dipakai sebagai offer spec; **deep-link trigger** |
| **Sales Monitor** | **"Run Blending Scenario" dari deal → pre-fill target spec; "Use this Result" update blendingScenario di deal** |
| **Quality** | **"Check Blend Option" dari quality warning → pre-fill contractSpec sebagai target; linkedQualityId disimpan** |
| Shipment Monitor | Blending untuk optimasi spec cargo yang sudah dimuat |

---

*End of SRS_10_Blending_Simulator — v2.2*

# Audit Gap Final: Web 1 (11GAWE) vs Web 2 (Rewrite) — Pasca Eksekusi

**Tanggal:** 2026-07-26  
**Status:** Audit ulang pasca eksekusi gap prioritas tinggi & medium

---

## Ringkasan Eksekusi yang Telah Selesai

### ✅ Gap Prioritas Tinggi yang Sudah Diperbaiki
1. **Outstanding Payment file upload** — Modal form sekarang support upload Invoice + Payment Proof langsung ke shipment documents.
2. **Forecast Supplier Candidate sourcing UI** — Modal create/edit/fit score/below-spec acknowledgement sudah aktif.
3. **Daily Delivery Document schema** — `DailyDeliveryDocument` model & migration sudah dibuat (belum wired ke UI upload).
4. **AI stub replacement:**
   - `src/lib/ai.ts` — OpenRouter/Groq helper tanpa dependency baru.
   - Meeting transcription — Groq Whisper bila `GROQ_API_KEY` ada, fallback bila kosong.
   - Meeting task extraction — AI extraction bila env ada.
   - Directory due diligence — AI + external news (GNews/NewsAPI).
   - Expense OCR — Multimodal vision bila env ada, anomaly flags.
   - Market scrape — AI scrape bila env ada.
5. **GlobalMarketScraper** — Background task tiap 6 jam sudah diinjeksi di layout.
6. **External news integration** — `src/lib/external-news.ts` + endpoint `/api/external-news` + due diligence wiring.
7. **Missing pages restored:**
   - `/operations` — Vessel Operations Command (minimal functional).
   - `/compliance` — Legal & Compliance Hub (minimal functional).
   - `/ai-optimization` — Route/blending optimization page (minimal functional).
   - `/sales-orders` — Legacy route redirect ke Forecast Sales + Sales Monitor.

---

## Gap yang Masih Tersisa (Prioritas dari Web 1)

### 🔴 **1. Dashboard — Filter & Rollup Incomplete**

#### 1.1 Country & Location Filters Missing
- **Web 1:** Filter `All Countries`, `All Locations`, region aliases untuk Kalimantan/Sumatra/Jawa.  
  File: `11GAWE/src/app/page.tsx:361`, `:390`, `:402`
- **Rewrite:** Hanya `status`, `type`, `timeRange`, `search`.  
  File: `src/modules/dashboard/components/filter-bar.tsx:5-13`, `:55-68`
- **Impact:** User tidak bisa filter dashboard per region/negara.

#### 1.2 Dashboard Filter Wiring Incomplete
- **Web 1:** Search/status/type/country/region/time/custom diaplikasikan ke deals/shipments/sources API.  
  File: `11GAWE/src/app/page.tsx:1835-1915`
- **Rewrite:** Hook hanya kirim `status`, `marketType`; widget lain ignore search/time/custom.  
  File: `src/modules/dashboard/hooks/use-dashboard.ts:11-22`, `:33-103`
- **Impact:** Filter tidak bekerja penuh; chart/widget tidak sync dengan filter pilihan user.

#### 1.3 Type Option Mismatch
- **Web 1:** `local` / `export`.  
  File: `11GAWE/src/app/page.tsx:385-389`
- **Rewrite:** `domestic` / `export`.  
  File: `src/modules/dashboard/components/filter-bar.tsx:6`
- **Impact:** Filter `local` di Web 1 hilang; semantik beda antara `domestic` (dalam negeri) vs `local` (regional/spot).

---

### 🔴 **2. Forecast Sales — Business Logic & Workflow Gaps**

#### 2.1 Dashboard Bucket Counts Incomplete
- **Web 1:** Total/draft/waiting approval/approved/FCO sent/pending buyer/deal/failed + bucket detail.  
  File: `11GAWE/src/app/projects/page.tsx:769-829`, `:2111`
- **Rewrite:** Summary card hanya `total`; sisanya `—`.  
  File: `src/modules/forecast-sales/components/forecast-client.tsx:23-43`
- **Impact:** Management tidak bisa cepat lihat bottleneck approval/buyer feedback.

#### 2.2 Project Document Templates & Checklists Missing
- **Web 1:** Template `export_shipment`, `domestic_delivery`, `spot_purchase`; checklist done/upload metadata per tipe.  
  File: `11GAWE/src/app/projects/page.tsx:292-350`, `:2556-2570`, `:3109-3116`
- **Rewrite:** Form/detail tidak ada UI template checklist.  
  File: `src/modules/forecast-sales/components/forecast-form-modal.tsx:150-223`, `forecast-detail-drawer.tsx:111-274`
- **Impact:** User tidak tahu dokumen mana yang wajib dilengkapi per flow export/domestic/spot.

#### 2.3 Forecast Urgent/AI Analysis Workflow Missing
- **Web 1:** Button "Run Urgent Analysis"; call `/api/projects/urgent-analysis`; analisis urgency pakai news/market/shipment blocker.  
  File: `11GAWE/src/app/projects/page.tsx:1122-1136`
- **Rewrite:** Tidak ada API urgent-analysis; tidak ada button/UI.  
  File: `src/app/api/forecasts/...` (urgent-analysis tidak ada)
- **Impact:** CEO/direksi tidak bisa rank forecast mana yang urgent berdasar external context.

#### 2.4 Shipping Instruction PDF from Forecast Sales Missing
- **Web 1:** Generate SI langsung dari project/shipment row.  
  File: `11GAWE/src/app/projects/page.tsx:1179-1270`, `:2639`, `:3165`
- **Rewrite:** Forecast detail tidak ada aksi SI; SI hanya ada di shipment module.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:76-109`
- **Impact:** Commercial team harus convert forecast → shipment dulu baru bisa generate SI; workflow lambat.

#### 2.5 Required Documents ZIP Download Missing
- **Web 1:** Download all required docs dari forecast detail.  
  File: `11GAWE/src/app/projects/page.tsx:1139-1177`, `:3171`, `:3196`
- **Rewrite:** Forecast detail tidak ada download ZIP.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:143-199`
- **Impact:** User harus download dokumen satu per satu dari Document Drive.

#### 2.6 Buyer Feedback Workflow Incomplete
- **Web 1:** FCO Sent → waiting feedback → negotiation → deal / failed; reason/history; conversion gated by deal status.  
  File: `11GAWE/src/app/projects/page.tsx:1948-2053`, `:2943-2989`
- **Rewrite:** Hanya `Mark Failed`; tidak ada buyer feedback status control/history di detail.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:93-108`, `src/app/api/forecasts/[id]/mark-failed/route.ts:19-39`
- **Impact:** Sales team tidak bisa track status negosiasi buyer; bisnis lost karena tidak tahu forecast mana yang perlu follow-up.

#### 2.7 FCO History Display Incomplete
- **Web 1:** FCO history/status; generated/download history per version.  
  File: `11GAWE/src/app/projects/page.tsx:1727-1748`, `:2903-2916`
- **Rewrite:** Generate FCO ada, tapi detail drawer tidak render `fcoRecords` history.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:97-101`, `src/app/api/forecasts/[id]/generate-fco/route.ts:46-67`
- **Impact:** Commercial tidak tahu FCO mana yang sudah dikirim/revised/outdated.

#### 2.8 Rough P&L Snapshot Incomplete
- **Web 1:** Quantity, supplier price, freight, blending, surveyor, royalty, tax export, other cost, margin %, selected supplier.  
  File: `11GAWE/src/app/projects/page.tsx:116-136`, `:2875`
- **Rewrite:** Hanya sales/buy/freight/margin estimate.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:201-211`
- **Impact:** Finance tidak bisa validasi full cost structure sebelum forecast diapprove.

#### 2.9 Supplier Candidate Auto-Score UI Incomplete
- **Web 1:** Auto-score sources, add candidates interaktif dari form draf forecast, below-spec acknowledgement wajib untuk fit < 80%.  
  File: `11GAWE/src/app/projects/page.tsx:833-885`, `:940-982`, `:1869`, `:2434`
- **Rewrite:** Modal candidate ada, tapi tidak ada source auto-score table di form/detail path shown; candidate masih manual entry.  
  File: `src/modules/forecast-sales/components/forecast-detail-drawer.tsx:143-199`
- **Impact:** Sourcing team tidak bisa cepat scan sources available; harus cek database manual.

---

### 🔴 **3. Sales Monitor / Deals — Rollup & Detail Missing**

#### 3.1 Forecast Sales Monitoring Rollup Missing
- **Web 1:** Merge projects + shipments + deals ke forecast-centric table dengan sales status, deal count, shipment count, volume, revenue.  
  File: `11GAWE/src/app/sales-monitor/page.tsx:122-288`, `:475-550`
- **Rewrite:** Hanya deals table.  
  File: `src/modules/sales-monitor/components/sales-monitor-client.tsx:151-156`, `deal-table.tsx:51-130`
- **Impact:** Management tidak bisa lihat sales pipeline end-to-end (forecast → deal → shipment → revenue).

#### 3.2 Summary Metrics Incomplete
- **Web 1:** Estimated revenue, total volume, active shipments, avg margin.  
  File: `11GAWE/src/app/sales-monitor/page.tsx:307-319`, `:436-466`
- **Rewrite:** Card hanya `total deals`; confirmed/in transit/completed = `—`.  
  File: `src/modules/sales-monitor/components/sales-monitor-client.tsx:20-40`
- **Impact:** Commercial tidak bisa tracking quick KPI.

#### 3.3 Deal Detail Modal Missing
- **Web 1:** View Detail modal dengan status/type/shipping/buyer country/qty/price/vessel/laycan + technical specs.  
  File: `11GAWE/src/app/sales-monitor/page.tsx:706`, `:723-771`
- **Rewrite:** Table hanya Edit/Del.  
  File: `src/modules/sales-monitor/components/deal-table.tsx:105-124`
- **Impact:** User tidak bisa quick view deal detail tanpa klik edit.

#### 3.4 Inline Status Update Missing
- **Web 1:** Row `<select>` quick update status.  
  File: `11GAWE/src/app/sales-monitor/page.tsx:692-702`
- **Rewrite:** Status update hanya via modal edit.  
  File: `src/modules/sales-monitor/components/deal-table.tsx:105-124`
- **Impact:** Workflow lambat untuk update status deal.

#### 3.5 Download Report Missing
- **Web 1:** Export deal report.  
  File: `11GAWE/src/app/sales-monitor/page.tsx:432`, `:773-781`
- **Rewrite:** Tidak ada.  
  File: `src/modules/sales-monitor/components/sales-monitor-client.tsx:96-149`
- **Impact:** Commercial harus copy-paste manual ke Excel.

---

### 🔴 **4. Market Price — Comparison & Scraper UI Gaps**

#### 4.1 Market vs Sales & Purchase Comparison Missing
- **Web 1:** Bandingkan index pilihan vs deals/shipments/suppliers/P&L assumptions; tampilkan avg sell/buy spread + rows.  
  File: `11GAWE/src/app/market-price/page.tsx:224-296`, `:586-650`
- **Rewrite:** Hanya calculators/history/trend.  
  File: `src/modules/market-price/components/market-price-client.tsx:16-55`
- **Impact:** Commercial tidak bisa validasi price competitiveness vs market.

#### 4.2 Scrape Interval UI Incomplete
- **Web 1:** Persist interval + dispatch `marketScrapeIntervalChanged`.  
  File: `11GAWE/src/app/market-price/page.tsx:117-121`, `:441-451`
- **Rewrite:** Modal select tidak ada `onChange`, tidak ada persistence.  
  File: `src/modules/market-price/components/market-price-client.tsx:94-101`, `src/shared/components/global-market-scraper.tsx:8-37`
- **Impact:** User tidak bisa adjust scrape interval; harus edit localStorage manual.

#### 4.3 Manual Fetch Logs Missing
- **Web 1:** Display live scrape logs.  
  File: `11GAWE/src/app/market-price/page.tsx:115-167`, `:469-483`
- **Rewrite:** Static system text only.  
  File: `src/modules/market-price/components/market-price-client.tsx:115-118`
- **Impact:** User tidak tahu scraper bekerja atau tidak.

#### 4.4 Target Sources Checkboxes Non-Functional
- **Web 1:** Semua source checked/read-only running.  
  File: `11GAWE/src/app/market-price/page.tsx:454-467`
- **Rewrite:** Hanya `GlobalCoal API` default checked; tidak ada persistence/use.  
  File: `src/modules/market-price/components/market-price-client.tsx:103-113`
- **Impact:** User tidak bisa pilih source mana yang di-scrape.

#### 4.5 Update History Detail Incomplete
- **Web 1:** Per-price history snapshot/actions/by/source.  
  File: `11GAWE/src/app/market-price/page.tsx:200-223`, `:764-790`
- **Rewrite:** Expanded row hanya ID/Created/Notes.  
  File: `src/modules/market-price/components/price-history.tsx:102-110`
- **Impact:** Audit trail kurang lengkap.

---

### 🟡 **5. Blending — Report & Composition Detail**

#### 5.1 Download Report Missing
- **Web 1:** Export blending report.  
  File: `11GAWE/src/app/blending/page.tsx:89`, `:217-224`
- **Rewrite:** Tidak ada.  
  File: `src/modules/blending-simulator/components/blending-client.tsx:182-331`
- **Impact:** QC harus screenshot/copy manual.

#### 5.2 Composition Percentages Missing
- **Web 1:** Live output dengan cargo composition + percentages.  
  File: `11GAWE/src/app/blending/page.tsx:171-180`
- **Rewrite:** Live preview hanya weighted parameters.  
  File: `src/modules/blending-simulator/components/blending-client.tsx:305-324`
- **Impact:** User tidak tahu exact proportion tiap cargo.

#### 5.3 Saved Confirmation Timestamp Missing
- **Web 1:** `Simulation Saved` + `Saved at` timestamp.  
  File: `11GAWE/src/app/blending/page.tsx:200-211`
- **Rewrite:** Result tidak ada saved timestamp/confirmation; hanya muncul di history.  
  File: `src/modules/blending-simulator/components/blending-client.tsx:182-331`
- **Impact:** User tidak yakin simulasi tersimpan atau tidak.

---

### 🟡 **6. Outstanding Payment — Evidence Link & Dispute Status**

#### 6.1 Evidence Upload Sudah Diperbaiki ✅
- **Status:** Upload Invoice + Payment Proof langsung di form modal sudah aktif.  
  File: `src/modules/outstanding-payment/components/payment-form-modal.tsx`, `src/app/api/outstanding-payments/[id]/upload/route.ts`

#### 6.2 Dispute Status Field Missing
- **Web 1:** `dispute_status` (text).  
  File: `11GAWE/src/app/outstanding-payment/page.tsx:48`, `:248`
- **Rewrite:** Model tidak ada field `disputeStatus`.  
  File: `src/modules/outstanding-payment/components/payment-form-modal.tsx`, `prisma/schema.prisma:OutstandingPayment`
- **Impact:** Finance tidak bisa track payment yang bermasalah/dispute dengan supplier.

---

### 🟡 **7. Shipment Monitor — Daily Delivery Document Upload Missing**

#### 7.1 Schema Sudah Dibuat ✅
- **Status:** `DailyDeliveryDocument` model & migration sudah ada.  
  File: `prisma/schema.prisma`, `prisma/migrations/20260725153600_daily_delivery_documents/migration.sql`

#### 7.2 UI Upload Belum Wired
- **Web 1:** Upload SKAB, DSR, BL/CM, COA POL, COA POD dengan tracking handover per dokumen; sync folder drive publik.  
  File: `11GAWE/src/app/shipment-monitor/page.tsx:2267-2301`, `:615`, `:722`, `:764`
- **Rewrite:** Schema ada, tapi UI upload + list document tidak ada.  
  File: `src/modules/shipment-monitor/components/daily-delivery-tab.tsx:1-136`
- **Impact:** Traffic/finance tidak bisa upload bukti handover domestik; compliance risk.

---

### 🟡 **8. Approval Center — Entity Type Mismatch**

#### 8.1 Approval Item Entity Type Incomplete
- **Web 1:** Approval bisa untuk `project` / `expense` / `shipment` (source change, barge change).  
  File: `11GAWE/src/app/approval-inbox/page.tsx:15-20`, `:154`, `:164`, `:174`, `:184`
- **Rewrite:** Hanya `forecast_project`; tidak ada expense approval flow.  
  File: `src/app/api/approval-center/route.ts:30-80`, `src/modules/approval-center/components/approval-center-client.tsx:68-162`
- **Impact:** Direksi tidak bisa approve expense via Approval Center; expense approval logic bypass/manual.

---

### 🟡 **9. Meetings — Video MOM Processor Missing**

#### 9.1 Audio Upload + Groq Whisper Sudah Diperbaiki ✅
- **Status:** Upload audio/record + Groq Whisper transcription sudah aktif bila env `GROQ_API_KEY` ada.  
  File: `src/app/api/meetings/[id]/transcribe/route.ts`, `src/modules/meetings/components/meetings-client.tsx`

#### 9.2 Video MOM Processor Workflow Missing
- **Web 1:** Upload video → Flask MOM processor server → job tracking → transcription + MOM + PDF.  
  File: `11GAWE/src/app/meetings/page.tsx:32-55`, `:127-155`, `:333-425`
- **Rewrite:** Tidak ada integrasi Flask MOM processor; tidak ada video upload UI.  
  File: `src/modules/meetings/components/meetings-client.tsx:1-380`
- **Impact:** User tidak bisa upload video meeting untuk automatic MOM generation.

---

### 🟡 **10. Expenses — OCR Sudah Diperbaiki, Anomaly Field Missing**

#### 10.1 Receipt OCR Sudah Diperbaiki ✅
- **Status:** OCR + anomaly flags sudah aktif bila env AI ada.  
  File: `src/app/api/expenses/ocr/route.ts`, `src/modules/expenses/components/expense-form-modal.tsx`

#### 10.2 Anomaly Database Fields Missing
- **Web 1:** `is_anomaly` (boolean), `anomaly_reason` (text), `ocr_data` (JSON).  
  File: `11GAWE/src/app/purchase-requests/page.tsx:50-52`, `:61`
- **Rewrite:** API OCR response ada `anomalyFlags`, tapi schema tidak persist `isAnomaly`, `anomalyReason`, `ocrData`.  
  File: `prisma/schema.prisma:Expense:971-991`, `src/app/api/expenses/ocr/route.ts:1-59`
- **Impact:** Anomaly flags hanya tampil saat OCR run; tidak tersimpan untuk audit/history.

---

### 🟡 **11. Directory — Due Diligence Sudah Diperbaiki, News Display Missing**

#### 11.1 AI Due Diligence + External News Sudah Diperbaiki ✅
- **Status:** Due diligence sekarang call AI + external news bila env ada.  
  File: `src/app/api/directory/[id]/due-diligence/route.ts`, `src/lib/external-news.ts`

#### 11.2 News Display in Detail Drawer Missing
- **Web 1:** Display external news articles + source attribution di detail partner.  
  File: `11GAWE/src/app/directory/client.tsx:267-300`
- **Rewrite:** API due diligence simpan `news` di `aiDueDiligence` JSON, tapi detail drawer tidak render news list.  
  File: `src/modules/directory/components/directory-client.tsx:340-370`, `src/app/api/directory/[id]/due-diligence/route.ts:17-37`
- **Impact:** User tidak bisa lihat news context yang trigger due diligence score.

---

### 🟡 **12. AI Agent — Context Missing**

#### 12.1 Shipment/Delivery/Source Context Missing
- **Web 1:** AI Agent context dari shipments + deals + sources.  
  File: `11GAWE/src/app/ai-agent/page.tsx:85-102`, `:131-158`, `:166-188`
- **Rewrite:** Hanya Forecast Sales context.  
  File: `src/app/api/ai-agent/excel-context/route.ts:34-111`
- **Impact:** AI Agent tidak bisa jawab pertanyaan tentang shipment/delivery/source.

---

### 🟢 **13. Operations, Compliance, AI Optimization — Restored (Minimal Functional)**

- **Status:** Pages sudah restored dengan data statis minimal functional.  
  File: `src/app/(dashboard)/operations/page.tsx`, `compliance/page.tsx`, `ai-optimization/page.tsx`
- **Impact:** Route tidak 404; UX basic functional; belum ada CRUD database/API.

---

## Rekomendasi Prioritas Eksekusi Berikutnya

### **Phase 1: Critical Business Logic (1-2 minggu)**
1. **Forecast Sales buyer feedback workflow** — FCO history + buyer feedback status + deal conversion gate.
2. **Sales Monitor rollup** — Forecast-centric table merge projects/deals/shipments.
3. **Dashboard filter wiring** — Apply search/country/region/time ke semua widgets.
4. **Approval Center expense integration** — Expense approval flow.
5. **Daily Delivery document upload UI** — Wire schema ke UI upload/list SKAB/DSR/COA.

### **Phase 2: UX Enhancement (1 minggu)**
6. **Forecast urgent analysis API** — `/api/forecasts/[id]/urgent-analysis` + button UI.
7. **Deal detail modal** — View-only modal untuk quick preview.
8. **Market price comparison** — Market vs sales/purchase spread analysis.
9. **Blending report export** — PDF/Excel download.
10. **Scraper interval persistence** — Save user-selected interval ke localStorage + apply.

### **Phase 3: Audit & Compliance (1 minggu)**
11. **Directory news display** — Render external news di detail drawer.
12. **Expense anomaly persistence** — Add `isAnomaly`, `anomalyReason`, `ocrData` fields ke schema.
13. **Outstanding payment dispute status** — Add `disputeStatus` field.
14. **Forecast document templates** — Template checklist per type.
15. **Market price history detail** — Full snapshot expand.

### **Phase 4: Advanced Features (Optional, 1-2 minggu)**
16. **Meetings video MOM processor** — Flask integration + job tracking.
17. **AI Agent shipment/source context** — Expand context beyond Forecast Sales.
18. **Forecast SI generation** — Generate SI dari forecast detail.
19. **Forecast ZIP download** — Download all required docs.
20. **Operations/Compliance CRUD** — Add database/API untuk vessel tracking/legal doc tracking.

---

## Catatan Teknis

### Environment Variables Dibutuhkan
- `GROQ_API_KEY` — Whisper transcription + chat.
- `OPENROUTER_API_KEY` — Chat/OCR/market/DD (alternatif Groq).
- `GNEWS_API_KEY` — External news extraction.
- `NEWS_API_KEY` — External news extraction (alternatif GNews).
- `GROQ_MODEL`, `OPENROUTER_MODEL` — Optional override model.

### Build Status
- **Last build:** 2026-07-26  
- **Status:** ✅ Success  
- **Warnings:** Font layout, hook deps (non-blocking).

### Files Modified in Last Execution
- `src/lib/ai.ts` (new)
- `src/lib/external-news.ts` (new)
- `src/shared/components/global-market-scraper.tsx` (new)
- `src/app/api/market-scrape/route.ts`
- `src/app/api/meetings/[id]/transcribe/route.ts`
- `src/app/api/meetings/[id]/extract-tasks/route.ts`
- `src/app/api/directory/[id]/due-diligence/route.ts`
- `src/app/api/expenses/ocr/route.ts` (new)
- `src/app/api/external-news/route.ts` (new)
- `src/modules/expenses/components/expense-form-modal.tsx`
- `src/modules/meetings/components/meetings-client.tsx`
- `src/modules/meetings/hooks/use-meetings.ts`
- `src/modules/forecast-sales/components/supplier-candidate-modal.tsx` (earlier)
- `src/modules/outstanding-payment/components/payment-form-modal.tsx` (earlier)
- `src/app/(dashboard)/operations/page.tsx` (new)
- `src/app/(dashboard)/compliance/page.tsx` (new)
- `src/app/(dashboard)/ai-optimization/page.tsx` (new)
- `src/app/(dashboard)/sales-orders/page.tsx` (new)
- `src/shared/components/layout/app-shell.tsx` (permissions)
- `prisma/schema.prisma` (DailyDeliveryDocument, DocumentStatus.rejected)
- `prisma/migrations/...` (multiple)

---

**End of Audit**

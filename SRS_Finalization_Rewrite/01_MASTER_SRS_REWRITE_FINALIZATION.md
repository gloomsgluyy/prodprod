# Master SRS - CoalTrade OS Rewrite Finalization

**Version:** 1.0  
**Date:** 2026-07-24  
**Prepared for:** AI/developer yang melanjutkan rewrite `C:\CoalTrade-Production`  
**Reference docs:** `docs_rewrite/00_PROJECT_CONTEXT.md`, `docs_rewrite/01_PRD.md`, `docs_rewrite/SRS_*.md`, current-system `SRS_CoalTrade_OS_Revisi`, current-system `Revisi_Execution`.

## 1. Objective

CoalTrade OS Rewrite harus menjadi sistem workflow end-to-end untuk bisnis trading batubara. Rewrite tidak boleh hanya menjadi versi UI/API yang lebih rapi, tetapi harus mempertahankan business logic existing dari sistem saat ini dan memperbaiki area yang belum production grade.

Target akhir:

- Feature parity dengan current system yang sudah berjalan.
- Workflow Forecast Sales sampai Shipment dan P&L berjalan tanpa re-input berulang.
- Document management punya public Document Drive, storage durable, download individual/all, dan akses critical yang aman.
- Market Price menjadi reference engine yang bisa diupdate manual, punya history, dan memberi warning ke Forecast/Sales/P&L.
- Approval, audit, revision, dan closing blocker konsisten.
- Performance tidak reload berlebihan saat pindah modul dan CRUD tidak terasa menggantung.
- Production deploy siap dengan DB migration, storage, RBAC, env, monitoring, dan test coverage minimal.

## 2. System Scope

### 2.1 In Scope

Modul wajib:

1. Dashboard / Command Center
2. Authentication dan RBAC
3. Forecast Sales
4. Sales Monitor
5. Shipment Monitor
6. Source / Supplier
7. Quality Control
8. Blending Simulator
9. Market Price
10. Document Management dan Document Drive
11. Shipping Instruction
12. FCO Generator
13. Summary Report per Forecast/Project
14. Outstanding Payment
15. Transshipment / Freight
16. Profit & Loss
17. Expenses
18. Meetings dan Tasks
19. Directory
20. Approval Center
21. Audit Logs
22. Production Readiness
23. AI Agent sebagai support, bukan core workflow.

### 2.2 Out of Scope

- Public customer portal penuh.
- Bank reconciliation otomatis.
- AIS vessel tracking.
- E-signature formal.
- OCR legal docs tingkat lanjut.
- Accounting ERP integration penuh.

## 3. Core Principles

### CP-01 Workflow, Not Spreadsheet

Setiap modul besar harus punya sub-section workflow. Shipment Monitor tidak boleh hanya tabel panjang. Forecast Sales tidak boleh hanya CRUD project.

### CP-02 Module Ownership

Data dan dokumen harus dibuat/upload di modul pemilik proses:

| Data/Dokumen | Owner module | Owner role |
|---|---|---|
| Offer profile, FCO, buyer feedback | Forecast Sales | Trader / Sales |
| SI | Shipment Monitor | Sales / Traffic |
| Required shipment docs | Shipment Monitor | Sales / Traffic |
| Additional docs | Shipment Monitor | Sales / Traffic |
| Critical docs | Shipment Monitor | Executive-restricted |
| Source readiness, legal, stock | Source | Source Team |
| QC, PSI, COA POL/POD | Quality | Quality Team |
| Payment proof, invoice reference | Outstanding Payment + Shipment reference | Finance / Sales |
| Freight, SPAL, laytime docs | Transshipment | Traffic / Ops |

### CP-03 No Overwrite for Critical Revisions

No overwrite untuk:

- Forecast Sales price/laycan/supplier revision.
- FCO generation/revision.
- SI generation/revision/cancellation.
- Source change.
- Barge/MV/TB/BG change.
- Critical document replacement.
- Market price daily updates.

Setiap perubahan harus punya old value, new value, reason, user, timestamp, dan audit log.

### CP-04 Generated Document Is System-Owned

SI, FCO, dan Summary Report bukan upload manual utama. Mereka harus generated dari data sistem. Setelah generated:

- metadata tersimpan di database,
- PDF/object key tersimpan jika production storage aktif,
- bisa dicari di Document Drive,
- bisa didownload dari modul pemilik dan Document Drive,
- versioning berlaku untuk revisi.

### CP-05 Approval Is a State Machine

Approval tidak boleh sekadar tombol yang mengganti field bebas. Harus ada state machine:

- Draft
- Submitted / Waiting Approval
- Approved
- Rejected
- Revision Requested
- Sent / Waiting Buyer
- Deal / Failed jika Forecast Sales

Reject wajib comment/reason. Approve boleh tanpa comment jika bisnis menginginkan tampilan simple. UI untuk role strict harus ringkas: dropdown `Set Approval`, comment hanya muncul saat reject/revision.

### CP-06 Closing Must Be Controlled

Shipment tidak boleh `completed/closed` jika:

- mandatory documents belum clear,
- SI tidak ada atau approval pending,
- final quantity belum valid,
- quality final missing/warning unresolved,
- payment mandatory belum sesuai rule,
- source/barge/SI revision masih pending,
- critical/open issue belum resolved atau reason belum lengkap.

### CP-07 Public Document Drive Is Isolated

User tanpa login boleh membuka `/document-drive` read-only untuk dokumen non-critical. Semua modul lain tetap terkunci. Critical document tidak boleh tampil/download untuk public user.

## 4. End-to-End Workflow

### E2E-01 Market Reference

Admin Marketing atau role authorized update Market Price harian:

- ICI 1-5
- Newcastle
- HBA / HBA I / HBA II / HBA III
- MGO
- USD/IDR FX rate
- source: Manual, Auto Scrape, Argus, GlobalCoal, atau custom source.

Output:

- price cards update,
- chart update,
- history append,
- Forecast Sales mendapat latest reference,
- Sales/P&L warning bisa dihitung.

### E2E-02 Forecast Sales

Trader membuat Forecast Sales sebagai offer/project rencana penjualan.

Mandatory sebelum submit:

- forecast month,
- offer/project name,
- trader name auto from user,
- buyer name,
- buyer country,
- commodity,
- quantity,
- laycan start/end,
- port of loading,
- sales term,
- target selling price,
- price basis,
- payment term,
- requested coal spec minimal GAR dan parameter lain sesuai bisnis,
- market price snapshot.

Draft boleh incomplete. Submit wajib complete.

### E2E-03 Supplier Candidate and Blending

Forecast Sales harus bisa menambahkan supplier candidates dari Source. Sistem membandingkan candidate spec dengan requested spec:

- stock/COB,
- supplier price,
- GAR/NAR,
- TM/IM,
- TS,
- Ash,
- VM,
- HGI,
- size,
- readiness/legal status.

Jika below spec, user harus acknowledge/reason sebelum lanjut.

Blending simulation di dalam Forecast Sales harus memberi output:

- final estimated GAR/NAR,
- final TM/IM,
- final TS,
- final Ash,
- final VM,
- average supplier cost,
- estimated blended cost,
- pass/warning/not recommended.

### E2E-04 Rough P&L Restricted

Setelah offer profile submitted, sistem membuat rough P&L otomatis:

- selling price,
- supplier/buying price,
- quantity,
- freight estimate,
- surveyor cost,
- royalty,
- tax/export cost,
- other cost,
- revenue,
- total cost,
- estimated gross profit,
- margin/MT,
- margin percent.

Akses hanya CEO, DIRUT, ASS_DIRUT, COO, atau management yang ditetapkan.

### E2E-05 Approval and FCO

Status flow:

```text
draft -> waiting_approval -> approved/rejected/revision_requested
approved -> FCO generated -> FCO sent -> waiting buyer feedback
waiting buyer feedback -> negotiation/pending -> deal/failed
deal -> convert to shipment
failed -> reason required + management notification
```

FCO tidak boleh generated/download sebelum approved.

FCO PDF harus mengikuti contoh `FCO.C2604 (1).pdf`:

- FULL CORPORATE OFFER,
- FCO number, version, date,
- buyer/addressee,
- declaration,
- commodity and coal specification table,
- origin,
- quantity and tolerance,
- laycan,
- port of loading,
- base price,
- price adjustment formula,
- shipping terms,
- loading rate,
- payment terms,
- independent surveyor,
- other terms,
- validity,
- signature block.

### E2E-06 Deal to Shipment

Deal confirmed dari Forecast Sales membuat Shipment:

- buyer,
- commodity,
- quantity,
- coal spec,
- laycan,
- POL/POD,
- sales price,
- buying price jika ada,
- payment term,
- surveyor,
- selected supplier/source,
- PIC trader,
- linked Forecast Sales ID,
- FCO reference.

Shipment awal `upcoming` atau `draft/upcoming` sesuai enum final.

### E2E-07 Shipment Execution

Shipment Monitor wajib punya sub-tabs:

- Info/Header
- Commercial Reference
- Source/Barge
- Quality
- SI
- Documents
- Domestic Handover
- POL/POD Timeline
- Payment
- Issues
- Closing

Data completeness score harus tampil. Score bukan pengganti closing blocker, tetapi membantu user tahu field mana yang kosong/default.

### E2E-08 Shipping Instruction

SI dibuat per shipment dari form Shipment Monitor, bukan upload.

Rules:

- H-10 rule dari first laycan.
- Early SI butuh reason dan approval/acknowledgment CEO.
- Revision menyimpan version lama.
- Cancellation menyimpan reason.
- PDF SI memuat `PROJECT NAME` atau `FROM MV/Forecast Sales` agar jelas berasal dari Forecast Sales mana.
- Required document section di SI harus menunjukkan upload status, misalnya `Filled, 1 Document Uploaded`.
- Kop surat dikosongkan tetapi space tetap tersedia untuk manual fill.
- SI number generated unik by system.

### E2E-09 Document Management

Shipment documents harus mendukung:

- drag and drop,
- choose file,
- PDF, DOCX, PNG, JPG, JPEG, WebP,
- multiple files per requirement type,
- edit metadata,
- delete/soft delete,
- upload/save,
- download single,
- download selected/dropdown,
- download all ZIP,
- unique file naming in ZIP and UI.

Document groups:

- Required document
- Additional document
- Critical document
- Generated SI
- Generated FCO
- Summary Report
- Domestic handover evidence
- Payment docs
- Quality docs

Critical document hanya terlihat untuk strict/executive roles.

### E2E-10 Public Document Drive

Document Drive harus:

- accessible tanpa login,
- read-only untuk public,
- search cepat,
- metadata-only listing,
- hide critical docs for public,
- include SI/FCO/Summary generated docs,
- file names jelas:
  - shipment number,
  - MV/TB/BG jika ada,
  - Forecast Sales name,
  - buyer,
  - document type,
  - SI/FCO number/version,
  - upload date jika membantu.

### E2E-11 Market Price Final Behavior

Market Price harus mendukung:

- input manual price,
- history per day and per update,
- updated by user or `Auto Scrape`,
- updated time,
- latest cards,
- chart trend,
- reference lookup by date/range,
- warning if stale,
- warning if offer price too low.

Jika auto scraping belum real, UI harus jujur: tampil sebagai `Auto Scrape stub/pending integration`, bukan seolah sudah live dari Argus.

## 5. Data Model Requirements

### 5.1 Forecast Sales

Wajib punya field atau related tables untuk:

- forecast month,
- project/offer name,
- trader user,
- buyer and country,
- commodity,
- quantity,
- laycan,
- POL/POD,
- sales term,
- price basis,
- target/final selling price,
- payment term,
- surveyor,
- full coal spec: GAR, NAR, TM, IM, TS, Ash, VM, HGI, size,
- supplier candidates one-to-many,
- selected supplier,
- below-spec acknowledgement,
- blending scenarios,
- market snapshot,
- historical selling reference,
- rough P&L,
- approval history,
- revision history,
- FCO records,
- buyer feedback records,
- linked shipment.

### 5.2 Shipment Documents

Rewrite current schema `@@unique([shipmentId, requirementCode])` is not enough for production because one requirement can have multiple files.

Required model direction:

- `DocumentRequirement` or `ShipmentDocumentRequirement`
- `DocumentFile` one-to-many
- `DocumentVersion` or version fields for critical replacement
- storage metadata: provider, bucket, objectKey, mimeType, originalName, size, checksum optional
- visibility: public/internal/critical
- source module and source entity
- soft delete fields.

### 5.3 Market Price

MarketPrice must support:

- multiple entries per date,
- entry timestamp,
- updatedBy,
- source label,
- action manual/scrape/import,
- ICI/Newcastle/HBA/MGO/FX fields,
- no overwrite daily history.

If business wants one latest value per date, implement a "daily latest view" at query layer, not destructive overwrite.

## 6. RBAC Requirements

### 6.1 Strict Roles

Strict/executive approval UI only visible to:

- CEO
- DIRUT
- ASS_DIRUT

Optional management view:

- COO
- CMO
- CPPO for view, not necessarily approve.

### 6.2 Market Price Edit

Manual price input only:

- ADMIN_MARKETING
- CEO/DIRUT/ASS_DIRUT if business approves fallback

All roles can view market price.

### 6.3 Public Access

Without login:

- `/document-drive` only,
- non-critical document listing and file proxy only.

With login but no permission:

- may access allowed modules based on role,
- critical docs gated.

## 7. Performance Requirements

### 7.1 Navigation Cache

After first load, switching between main modules must not re-fetch full data unnecessarily. React Query cache must use stable query keys and reasonable stale time.

Target:

- main page first meaningful data < 3s for normal dataset,
- subsequent navigation from cached data < 1s,
- CRUD optimistic or targeted cache update < 2s perceived feedback.

### 7.2 Loading State

Skeleton must appear while data needed for page is not loaded. Page must not show empty/zero/default cards as if data is loaded.

Rule:

- `isLoading`: show skeleton.
- `isFetching` with cached data: show subtle refreshing indicator.
- error: show retry and clear message.
- empty data: show empty state only after load success.

### 7.3 API

APIs must:

- use pagination,
- use selective `select`,
- avoid N+1,
- avoid schema mutation inside request,
- avoid generating PDF/ZIP during listing,
- invalidate only affected query keys after CRUD.

## 8. Production Grade Definition

Rewrite is production grade only when:

- Prisma migrations exist and can run from clean DB.
- Runtime DB uses pooler.
- Object storage is configured and tested.
- Critical RBAC is enforced server-side on all mutating routes.
- Public Document Drive cannot leak critical docs.
- SI/FCO/Summary generated docs are persisted and downloadable.
- Forecast -> FCO -> Deal -> Shipment flow works end-to-end.
- Shipment closing blockers work.
- Market Price manual input works.
- Audit logs exist for critical mutations.
- At least smoke/E2E tests cover core flows.
- `/production-readiness` is truthful and does not claim pass by checking stubs only.


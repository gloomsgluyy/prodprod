# CoalTrade OS – Module Revision Matrix

> **Sumber:** `CoalTrade_OS_Module_Revision_Matrix_SIMPLE.xlsx` & `CoalTrade_OS_Module_Revision_Matrix.xlsx`
> **Dibuat:** 2026-05-22

---

## 🎯 Tujuan Dokumen

| Item | Keterangan |
|------|-----------|
| **Purpose** | Merangkum apa yang perlu diubah, direvisi, atau ditambah pada modul CoalTrade OS sehingga menjadi end-to-end workflow — bukan hanya halaman entry data terpisah |
| **Core Goal** | Project/deal, source, quality, shipment execution, dokumen, payment, dan P&L bisa di-trace dalam satu connected workflow |
| **Final Roles** | Sales/Traffic Team, Source Team, Quality Team (Sales & Traffic digabung sebagai satu tim operasional-komersial) |
| **Critical Rule** | Domestic: Source Team hanya sampai sourcing/konfirmasi source. Final TB/BG nomination & barge change dipegang Sales/Traffic Team |

---

## 1. Flow End-to-End (Simple)

| No | Tahap | Modul | Siapa Input | Isi Utama | Output |
|----|-------|-------|-------------|-----------|--------|
| 1 | Mulai dari peluang/deal | Sales Monitor / Projects | Sales / Traffic | Buyer, project, qty, harga, laycan, FCO/MoM/PO | Deal confirmed |
| 2 | Buat shipment | Shipment Monitor | System + Sales/Traffic | Data shipment otomatis dari deal | Shipment ID dibuat |
| 3 | Cek source | Source | Source Team | Supplier, IUP, RKAB, jetty, stock, cargo readiness | Source submitted |
| 4 | Cek quality awal | Quality | Quality Team | QC, PSI, source quality | Quality status awal |
| 5 | Buat SI | Shipment Monitor – SI | Sales / Traffic | Shipping Instruction per shipment | SI PDF |
| 6 | Jalankan shipment | Shipment Monitor | Sales / Traffic | Nomination, loading, BL, POD, discharge | Shipment berjalan |
| 7 | Dokumen | Document Checklist | Sesuai jenis dok | Upload docs, status, tanggal, aging | Dokumen terkontrol |
| 8 | Quality final | Quality | Quality Team | COA POL, COA POD, comparison | Passed / Warning |
| 9 | Payment | Outstanding Payment | Sales/Traffic/Finance | Invoice, due date, paid, overdue | Payment status |
| 10 | Closing | Shipment Monitor | Sales / Traffic | Cek final qty, docs, quality, issue, payment | Shipment closed |

---

## 2. Revisi Modul yang Ada

| Modul | Masalah / Gap | Yang Perlu Diganti | Yang Perlu Ditambah | Owner | Prioritas |
|-------|-------------|-------------------|---------------------|-------|-----------|
| **Dashboard** | Kalau cuma angka, kurang membantu | Jadikan dashboard alert | Source pending, quality warning, docs pending, payment overdue, issue, barge/source change | All view | 🔴 High |
| **Partners & Directory** | Data bisa double kalau input manual | Jadikan master data pilihan dropdown | Buyer, supplier, source, surveyor, agent, bank, barge owner, vendor | Admin | 🟡 Medium |
| **Projects** | Bisa overlap dengan Sales Monitor | Projects = master project/deal | Status deal, link ke shipment, convert to shipment | Sales / Traffic | 🔴 High |
| **Sales Monitor** | Belum connect kuat ke shipment | Connect ke Projects & Shipment Monitor | FCO generator, buyer feedback, approval, rough P&L | Sales / Traffic | 🔴 High |
| **Market Price** | Harga belum otomatis jadi warning | Connect ke Sales & P&L | ICI, NEWC, HBA/HPB, MGO, kurs, price warning | Sales / Admin | 🟡 Medium |
| **Source** | Source bisa dianggap handle semua | Batasi hanya source & cargo readiness | Legal source, RKAB, kuota export, COB, hauling, source issue | Source Team | 🔴 High |
| **Quality** | Belum jadi workflow QC lengkap | Jadikan QC workflow | QC, PSI, COA POL, COA POD, comparison, warning | Quality Team | 🔴 High |
| **Blending Simulasi** | Belum connect ke deal/source | Connect ke Sales, Source, Quality | Average GAR/TS/Ash/TM, cost, margin, pass/warning | Sales/Source/Quality | 🟡 Medium |
| **Shipment Monitor** | Jangan jadi tabel Excel panjang | Pecah jadi sub-tab | SI, Barge Change Log, Source Change, docs, timeline, issue, closing | Sales / Traffic | 🔥 Very High |
| **Transshipment / Freight** | Belum jelas link ke shipment/P&L | Connect ke Shipment & P&L | Freight, barging, laytime, demurrage, SPAL, PBM, PNBP | Sales / Traffic | 🟡 Medium |
| **Outstanding Payment** | Kalau hanya list, kurang kontrol | Link ke shipment & invoice | Due date, paid date, overdue, dispute, vendor payment | Sales/Traffic/Finance | 🔴 High |
| **P&L** | Kalau manual rawan salah | Tarik data otomatis dari modul lain | Selling price, cost, freight, final qty, margin/MT | Management | 🟡 Medium |
| **Expenses** | Perlu link ke shipment bila ada | Tambah related shipment | Category, vendor, amount, approval, notes | Admin / Finance | 🟢 Low |
| **Tasks** | Kalau berdiri sendiri, lupa konteks | Link ke shipment/project/issue | PIC, due date, reminder, status | All team | 🟡 Medium |
| **Meeting** | Belum tentu nyambung ke shipment | Link ke project/shipment | Action points, PIC, due date | All team | 🟢 Low |
| **AI Excel Agent** | Supporting, bukan main flow | Dipakai untuk import & cek data | Detect missing data, summarize, compare | Admin | 🟢 Low |

---

## 3. Sub-Modul / Fitur Wajib Ditambah

| Tambahan | Letaknya di Mana | Untuk Apa | Isi Field | Approval? | Catatan |
|----------|-----------------|-----------|-----------|-----------|---------|
| **Source Change Traceability** | Source + Shipment Monitor | Trace kalau source berubah | Old source, new source, reason, evidence, CEO approval, contract status | CEO | Source lama tidak boleh hilang |
| **Shipping Instruction (SI)** | Shipment Monitor | Buat SI per shipment | SI no, shipment, supplier, source, qty, laycan, vessel/barge, PDF | CEO jika early/revisi | SI normal hanya H-10 dari 1st day laycan |
| **Barge Change Log** | Shipment Monitor | Trace perubahan tongkang | Old TB/BG, new TB/BG, reason, evidence, changed by, time | Jika perlu | Jangan overwrite data lama |
| **Document Checklist** | Shipment Monitor | Kontrol dokumen | Doc name, status, received date, submitted date, aging, upload | No/conditional | Dokumen wajib harus lengkap sebelum close |
| **Domestic Document Handover** | Shipment Monitor | Trace dokumen domestic | SKAB, DSR, BL/CM, COA, finance handover, aging | No/conditional | Kelihatan dokumen nyangkut di siapa |
| **Quality Comparison** | Quality | Bandingkan hasil quality | Contract vs QC vs PSI vs COA POL vs COA POD | No/conditional | Warning jika beda dari spec |
| **Closing Checklist** | Shipment Monitor | Cegah shipment close terlalu cepat | Final qty, docs, quality, issue, payment | No | Close hanya jika data wajib lengkap |
| **Approval Center** | Dashboard / System | Lihat approval pending | FCO, SI early, SI revision, source change | CEO | Biar CEO tidak lewat WA saja |
| **Audit Trail** | Semua modul | History perubahan data | Changed by, time, old value, new value | No | Wajib untuk data penting |

---

## 4. Input Dokumen – Di Mana Upload?

| Jenis Dokumen | Contoh | Input di Modul | Owner Input | Wajib Upload? |
|---------------|--------|----------------|-------------|---------------|
| Commercial | FCO, MoM, PO, buyer contract | Projects / Sales Monitor | Sales / Traffic | Yes |
| Source / Legal | IUP OP, RKAB, kuota export, supplier contract | Source | Source Team | Yes |
| Source Evidence | Cargo readiness, stock/COB, hauling evidence | Source | Source Team | Yes if issue |
| Quality | QC report, PSI report | Quality | Quality Team | Yes |
| COA | COA POL, COA POD, lab result | Quality | Quality Team | Yes |
| SI | Shipping Instruction PDF | Shipment Monitor – SI | Sales / Traffic | Yes |
| Export Shipment Docs | VesNom, Stowage Plan, NOR POL, BL, PEB, LHV, Surveyor LS | Shipment Monitor – Document Checklist | Sales / Traffic | Yes |
| Domestic Shipment Docs | SKAB, DSR Carbon, BL/CM, COA, Time Sertif | Shipment Monitor – Document Checklist | Sales / Traffic | Yes |
| POD Docs | Discharge report, POD report, weightbridge report | Shipment Monitor | Sales / Traffic | Yes |
| Payment Docs | Invoice, full set docs, payment proof | Outstanding Payment / Shipment Monitor | Sales/Traffic/Finance | Yes |
| Freight / Cost Docs | SPAL, freight invoice, PBM, PNBP/STS | Transshipment / Freight | Sales / Traffic | Yes |
| Issue Evidence | Bukti delay, chat/email, buyer/supplier note | Issue Log | Team terkait | Yes if issue |

---

## 5. Role & Owner

| Role | Fokus | Yang Diinput | Tidak Diinput |
|------|-------|-------------|---------------|
| **Sales / Traffic Team** | Commercial + shipment execution | Sales offer, project, FCO, shipment, SI, nomination, loading, POD, docs, payment monitoring, closing | Source legal/cargo detail, QC result |
| **Source Team** | Source + supplier + cargo readiness | Source, supplier, IUP, RKAB, jetty, stock, COB, hauling, source issue, source change request | Final domestic TB/BG, loading/POD final, COA final |
| **Quality Team** | QC + PSI + COA | QC, PSI, source quality, COA POL, COA POD, comparison, quality warning | Commercial, source legal, final nomination |
| **CEO / Management** | Approval & view | Approve FCO, early SI, SI revision, source change, high risk issue | Input daily operation |
| **Admin / Finance** | Support data & finance | Master data, payment received, expenses, P&L support | Shipment operation |

---

## 6. Business Rules Wajib untuk Programmer

| No | Rule | Kenapa Penting | Modul Terkait |
|----|------|----------------|---------------|
| 1 | Deal confirmed harus bisa create shipment otomatis | Supaya tidak input ulang | Projects, Sales Monitor, Shipment Monitor |
| 2 | Domestic Source Team hanya sampai sourcing | Supaya final tongkang dipegang Sales/Traffic | Source, Shipment Monitor |
| 3 | Ganti tongkang wajib masuk Barge Change Log | Supaya perubahan TB/BG ke-trace | Shipment Monitor |
| 4 | Ganti source wajib masuk Source Change Traceability | Supaya source lama & baru jelas | Source, Shipment Monitor |
| 5 | SI normal hanya bisa issue H-10 dari laycan | Supaya SI tidak terlalu cepat tanpa kontrol | Shipment Monitor – SI |
| 6 | SI sebelum H-10 wajib CEO approval | Supaya ada acknowledgment management | Shipment Monitor – SI, Approval Center |
| 7 | Revisi SI wajib ada revision log | Supaya SI lama dan baru ada history | Shipment Monitor – SI |
| 8 | Quality harus compare contract vs QC/PSI/COA | Supaya warning quality kelihatan | Quality |
| 9 | Dokumen wajib punya status, tanggal, aging, upload | Supaya dokumen tidak hilang/terlambat | Document Checklist |
| 10 | Shipment tidak boleh closed kalau data wajib belum lengkap | Supaya closing aman | Shipment Monitor |
| 11 | Issue/Hold/Cancelled wajib ada reason | Supaya tidak ada status gantung | Issue Log |
| 12 | P&L sebaiknya tarik data otomatis | Supaya margin tidak salah input | P&L, Shipment, Payment, Freight |

---

## 7. Roadmap Prioritas Revisi

### Phase 1 — Fondasi (Very High)
| Yang Dikerjakan | Output |
|----------------|--------|
| Rapikan role + hubungan Sales/Projects ke Shipment | Deal bisa create shipment |
| Revisi Shipment Monitor jadi sub-tab | Shipment tidak lagi seperti Excel panjang |
| Tambah Barge Change Log | Perubahan tongkang ke-trace |
| Tambah Document Checklist + aging | Dokumen jelas ada di mana |

### Phase 2 — Traceability & Quality (High)
| Yang Dikerjakan | Output |
|----------------|--------|
| Tambah Source Change Traceability | Perubahan source ke-trace (butuh CEO approval) |
| Tambah SI per Shipment + H-10 rule | SI PDF dan history jelas |
| Revisi Quality jadi QC/PSI/COA Comparison | Quality warning jelas |
| Tambah Domestic Document Handover | Dokumen domestic tidak nyangkut |

### Phase 3 — Finansial & Dashboard (Medium)
| Yang Dikerjakan | Output |
|----------------|--------|
| Connect Payment, Freight, P&L | Margin dan outstanding lebih akurat |
| Dashboard alert-based | Management bisa lihat masalah cepat |

---

## 8. Module Revision Matrix (Detail — Full File)

| Existing Module | What It Should Become | Need to Revise | Need to Add | Owner | Priority |
|----------------|----------------------|----------------|-------------|-------|----------|
| Dashboard | Alert-based control tower | Tidak hanya angka; harus ada operational alert & blockers | Shipment status, source pending, quality warning, doc aging, payment overdue, open issue, barge/source/SI change alerts | All roles | High |
| Partners & Directory | Master data for all parties | Hindari repeated manual typing | Buyer, supplier, source, IUP OP, surveyor, lab, agent, barge owner, bank, vendor, internal PIC | Admin / Sales-Traffic | Medium |
| Projects | Master project/deal card | Clarify difference with Sales Monitor; hold deal identity & link ke shipment | Project status, related FCO/MoM/PO, related shipment ID, convert-to-shipment button | Sales/Traffic Team | High |
| Sales Monitor | Sales forecast, offer/FCO, buyer feedback & deal conversion | Must connect ke Projects & Shipment Monitor | FCO generator, CEO approval, rough P&L restricted, buyer feedback, convert to shipment | Sales/Traffic Team | High |
| Market Price | Reference price engine for offers & P&L | Market price should appear when Sales input offer price | ICI, NEWC, HBA/HPB, MGO, FX rate, historical price, price warning | Sales/Traffic / Admin | Medium |
| Shipment Monitor | Main operational shipment control center | Do NOT make flat Excel table; harus sub-tabs & workflow logic | Commercial ref, source result, source change, SI, barge change log, timelines, docs, quality, payment, issue, closing checklist | Sales/Traffic Team | **Very High** |
| Transshipment / Freight | Logistics, freight, laytime & demurrage module linked ke shipment | Must connect ke Shipment Monitor & P&L | Freight cost, barging, PBM, stevedoring, PNBP, laytime, demurrage, despatch, SPAL, SI to barge owner | Sales/Traffic Team | Medium |
| Source | Source confirmation workflow | Clarify Source Team scope; domestic source stops at sourcing only | Legal source, IUP OP, RKAB, kuota export, jetty, cargo readiness, hauling, COB, source issue, source change traceability | Source Team | High |
| Quality | Quality Control workflow | Do NOT only store COA; must compare source/QC/PSI/COA against contract spec | QC result, PSI result, source quality, COA POL, COA POD, quality comparison, warnings, claim potential | Quality Team | High |
| Blending Simulasi | Simulation engine for offer/source decisions | Must connect ke Sales, Source & Quality | Final GAR/TS/Ash/TM, average cost, estimated margin, pass/warning/not recommended | Sales+Source+Quality | Medium |
| P&L | Estimated and actual P&L linked ke shipment | Do NOT input all manually; pull from other modules | Selling price, supplier price, freight, PBM, PNBP, demurrage, final qty, margin/MT | Restricted / Management | Medium |
| Outstanding Payment | Buyer and vendor payment tracker | Must link payment ke shipment & document completion | Invoice amount, due date, received payment, overdue, dispute amount, vendor payment aging | Sales/Traffic / Finance | High |
| Expenses | Supporting expense module | Should link ke shipment or non-shipment category | Expense category, vendor, amount, approval, related shipment/project | Admin / Finance | Low |
| Tasks | Follow-up action layer linked to issues/docs/payment | Do NOT let tasks stand alone without link ke shipment/project | Linked module, linked shipment, PIC, due date, reminder, status | All roles | Medium |
| Meeting | MoM and action-point tracker | Must link ke project/shipment and create tasks | Attendees, summary, action plan, PIC, due date, related project/shipment | All roles | Low |
| AI Excel Agent | Supporting import, compare & summary tool | Do NOT use as main workflow | Historical Excel import, missing data detection, compare fields, summary report | Admin / Power user | Low |

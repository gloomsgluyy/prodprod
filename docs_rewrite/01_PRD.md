# CoalTrade OS — Product Requirements Document (PRD)

**Version:** 2.0
**Tanggal:** Juli 2026
**Product Owner:** Client (CEO/Management)
**Prepared for:** Development Team Rewrite

---

## 1. Product Vision

### Vision Statement

> CoalTrade OS menjadi **satu-satunya platform internal** yang digunakan oleh seluruh tim Commercial untuk mengelola bisnis trading batubara — menggantikan Excel tracking, WhatsApp coordination, dan dokumen tersebar — dalam satu workflow terintegrasi.

### Objectives

1. **Eliminasi Excel tracking** — Semua data masuk ke sistem, bukan spreadsheet terpisah
2. **Workflow-driven operations** — Setiap proses memiliki alur yang jelas dari input sampai output
3. **Alert-based monitoring** — Management melihat masalah, bukan hanya angka
4. **Traceability** — Setiap perubahan penting tercatat (source, barge, SI, price, quality)
5. **Controlled closing** — Shipment tidak bisa ditutup jika data belum lengkap
6. **Role-based access** — Setiap user hanya melihat dan mengubah data sesuai perannya

---

## 2. Target Users & Persona

### Persona 1: Trader (Sales/Traffic)
- **Jabatan:** CMO, Head of Traffic, Junior Trader, Traffic Admin, Commercial Admin
- **Kebutuhan:** Membuat forecast/offer, mengelola shipment, tracking dokumen, monitoring pembayaran
- **Pain Point:** Banyak data di Excel, sulit tracking status per shipment, FCO manual
- **Solusi:** Workflow terintegrasi dari forecast → deal → shipment → closing

### Persona 2: Source Team
- **Jabatan:** CPO, Purchase Supervisor, Supplier Admin
- **Kebutuhan:** Konfirmasi source/supplier, cek legalitas, update readiness
- **Pain Point:** Scope kerja tidak jelas antara sourcing dan traffic, perubahan source tidak tercatat
- **Solusi:** Modul Source dengan scope yang jelas + Source Change Traceability

### Persona 3: Quality Team
- **Jabatan:** QC Manager, QC Admin
- **Kebutuhan:** Input hasil QC/PSI/COA, bandingkan dengan spec kontrak
- **Pain Point:** Data quality berdiri sendiri, tidak link ke shipment
- **Solusi:** Quality workflow terintegrasi ke shipment dengan comparison otomatis

### Persona 4: CEO / Management
- **Jabatan:** CEO, Ass. CEO, COO, CMO
- **Kebutuhan:** Overview bisnis, approval workflow, P&L monitoring
- **Pain Point:** Approval via WhatsApp, tidak ada dashboard yang menunjukkan blockers
- **Solusi:** Dashboard alert-based + Approval Center terpusat

### Persona 5: Admin / Finance
- **Jabatan:** Admin Operation, Finance
- **Kebutuhan:** Master data, payment tracking, expense management
- **Pain Point:** Data duplicate, payment monitoring manual
- **Solusi:** Directory terpusat + Outstanding Payment terintegrasi

---

## 3. Feature Map

### 3.1 Dashboard (Command Center)

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-DASH-01 | Global Filter Bar | High | Filter data seluruh dashboard: search, status, market type, country, region, time range |
| F-DASH-02 | Metric Cards | High | 5 kartu metrik: Total Shipments, Active, Volume, Revenue (CEO), Margin (CEO) |
| F-DASH-03 | Market Price Mini Widget | High | 10 index harga terbaru dengan delta perubahan |
| F-DASH-04 | Total Volume Card | High | Volume total dengan breakdown per status, segmen, tahun |
| F-DASH-05 | Quantity per Month Chart | High | Stacked bar chart Local vs Export per bulan |
| F-DASH-06 | Priority Tasks Widget | Medium | 6 task teratas berdasarkan prioritas |
| F-DASH-07 | Upcoming Meetings Widget | Medium | 3 meeting terdekat dengan Add to Calendar |
| F-DASH-08 | Stock Inventory Widget | Medium | Total stok dan 4 source teratas |
| F-DASH-09 | Shipment Tables | High | Tabel shipment aktif dengan link ke detail |
| F-DASH-10 | Waiting Approval Widget | High | Proyek menunggu persetujuan management |
| F-DASH-11 | Document Aging Alerts | High | Alert dokumen yang melewati batas waktu |
| F-DASH-12 | Blocker Control Tower | Very High | Alert lintas modul: payment, quality, source, barge, closing, domestic |
| F-DASH-13 | AI Forecast Urgency Panel | Medium | AI analysis urgency (CEO only) |
| F-DASH-14 | User Activity Log | Low | Summary aktivitas user (CEO only) |
| F-DASH-15 | Forecast Sales Funnel | High | Pipeline status offer dari draft sampai deal/failed |
| F-DASH-16 | Source Pending Widget | High | Waiting source confirmation, legal pending, cargo not ready |
| F-DASH-17 | Quality Warning Widget | High | Waiting QC/PSI/COA, warning, claim potential |
| F-DASH-18 | Revision Activity Widget | Medium | Recent source/barge/SI/price revisions |
| F-DASH-19 | Approval Queue Widget | High | Pending approvals untuk CEO |
| F-DASH-20 | Shipment Completeness Widget | Medium | Shipment dengan data tidak lengkap |

### 3.2 Authentication

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-AUTH-01 | Email/Password Login | Very High | Login dengan email dan password via NextAuth.js |
| F-AUTH-02 | JWT Session | Very High | Session management berbasis JWT |
| F-AUTH-03 | Protected Routes | Very High | Semua route kecuali /login memerlukan autentikasi |
| F-AUTH-04 | Demo Accounts | Low | Daftar akun demo untuk testing |
| F-AUTH-05 | RBAC Enforcement | Very High | Role-based access control di seluruh modul |

### 3.3 Shipment Monitor

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-SHIP-01 | Shipment List + Tabs | Very High | Tabel shipment dengan filter tab (All/Upcoming/Loading/In Transit/Completed/Cancelled) |
| F-SHIP-02 | Summary Cards | High | Metrik per status (count, volume, value) |
| F-SHIP-03 | Detail Panel - Info | Very High | Detail lengkap: buyer, vessel, port, laycan, pricing, spec |
| F-SHIP-04 | Detail Panel - Documents | Very High | Checklist 11 jenis dokumen wajib, upload, status, aging |
| F-SHIP-05 | Detail Panel - Source/Barge | Very High | Source assignment, barge assignment, change log |
| F-SHIP-06 | Detail Panel - Issues | High | Issue log per shipment, severity, resolution |
| F-SHIP-07 | Detail Panel - Domestic Handover | High | 5 jalur tracking dokumen domestik (SKAB/DSR/BL/COA POL/COA POD) |
| F-SHIP-08 | Detail Panel - Financial | High | Detail keuangan: sell/buy price, freight, royalty, margin |
| F-SHIP-09 | Shipping Instruction | Very High | Generate SI per shipment, H-10 rule, revision history |
| F-SHIP-10 | Daily Delivery Log | Medium | CRUD log pengiriman harian |
| F-SHIP-11 | Report Export | Medium | Export laporan via ReportModal |
| F-SHIP-12 | AI Risk Analysis | Medium | AI risk assessment per shipment |
| F-SHIP-13 | Barge Change Log | Very High | Traceability perubahan TB/BG dengan history |
| F-SHIP-14 | Source Change Traceability | Very High | Trace perubahan source dengan approval CEO |
| F-SHIP-15 | Closing Checklist | Very High | Validasi final qty, docs, quality, payment sebelum close |
| F-SHIP-16 | POL/POD Timeline | High | Timeline loading & discharge milestones |
| F-SHIP-17 | Data Completeness Score | High | Persentase kelengkapan data per shipment |
| F-SHIP-18 | Commercial Reference | High | Link ke FCO/MoM/PO, contract, pricing |
| F-SHIP-19 | Pagination & Search | High | Pagination, page size, search filter |
| F-SHIP-20 | Charts (Volume/Status/Margin) | Medium | AreaChart, BarChart, PieChart, LineChart |

### 3.4 Market Price Index

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-MKT-01 | Price Cards (10 index) | High | ICI 1-5, Newcastle, HBA, HBA I-III dengan delta |
| F-MKT-02 | Standard Index Calculator | High | Calculator buying/selling berdasarkan index + premium/discount |
| F-MKT-03 | HPB Estimation Calculator | High | Estimasi HPB berdasarkan GAR, TM, TS, ASH |
| F-MKT-04 | Market vs Sales Comparison | High | Bandingkan market price vs harga deal aktual |
| F-MKT-05 | Price Trend Chart | Medium | ComposedChart 6 line + 1 bar, range selector |
| F-MKT-06 | Manual Price Input | High | Form input 10 field harga per hari |
| F-MKT-07 | Price History | Medium | Riwayat update per entry (expandable) |
| F-MKT-08 | Auto Scraping (Groq AI) | Medium | AI scraping market price, interval settings |
| F-MKT-09 | Scraping Settings Modal | Medium | Interval, target sources, manual fetch, logs |

### 3.5 Sales Monitor

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-SAL-01 | Pipeline Status Tabs | High | 9 status tab: All, Waiting Approval, Offer Submitted, Confirmed, dll. |
| F-SAL-02 | Deals Table | High | Project, buyer, country, quantity, price, value, status |
| F-SAL-03 | Deal Detail Modal | High | Info lengkap deal, linked shipments |
| F-SAL-04 | Add/Edit Form | High | Full form: project name, buyer, segment, spec, pricing |
| F-SAL-05 | Summary Cards | Medium | Total deals, total value, avg price |
| F-SAL-06 | Report Export | Medium | Export laporan deal/sales |

### 3.6 Forecast Sales / Projects

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-FS-01 | Project Cards/List | Very High | Daftar proyek dengan semua field detail |
| F-FS-02 | Create/Edit Project Form | Very High | 30+ field form lengkap termasuk spec, supplier, blending |
| F-FS-03 | CEO Approval Workflow | Very High | Draft → Submit → CEO Review → Approved/Rejected/Revision |
| F-FS-04 | FCO Generator (jsPDF) | Very High | Generate PDF FCO dengan format standar |
| F-FS-05 | Document Checklist Template | High | Upload per checklist item per project |
| F-FS-06 | Approval History Timeline | High | Log approval dengan user, timestamp, comment |
| F-FS-07 | Revision History | High | Tracking perubahan field per project |
| F-FS-08 | Supplier Candidates | High | Daftar calon supplier dengan perbandingan spec |
| F-FS-09 | Embedded Blending Simulation | High | Simulasi blending di dalam offer input |
| F-FS-10 | Restricted Rough P&L | High | P&L otomatis (CEO/Management only) |
| F-FS-11 | Buyer Feedback Tracking | Very High | Status FCO Sent → Deal/Failed |
| F-FS-12 | Convert to Shipment | Very High | One-click convert deal ke shipment |
| F-FS-13 | Management Dashboard | High | Metric cards pipeline per status |
| F-FS-14 | Price/Laycan Revision Log | High | Revision log untuk perubahan harga/laycan |

### 3.7 Outstanding Payment

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-PAY-01 | Summary Cards | Medium | Total records, qty, total DP |
| F-PAY-02 | Status Tab Filter | High | All, Pending, Partial, Paid |
| F-PAY-03 | Payment Data Table | High | Full table dengan evidence links |
| F-PAY-04 | Add/Edit Form Modal | High | 15+ fields termasuk linked shipment |
| F-PAY-05 | Document Upload | High | Invoice dan payment proof upload (linked ke shipment) |
| F-PAY-06 | Vendor Payment Tracking | High | Vendor invoice, approval, paid tracking |

### 3.8 Sources & Supplier

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-SRC-01 | Source List (Table/Card View) | High | Dual view toggle |
| F-SRC-02 | Low Stock Alerts | High | Alert supplier dengan stok rendah |
| F-SRC-03 | Add/Edit Form | High | 25+ fields termasuk coal spec dan stock locations |
| F-SRC-04 | Multi-entry Stock Locations | Medium | Dynamic rows untuk lokasi stok |
| F-SRC-05 | KYC/PSI Status Tracking | High | Status verifikasi supplier |
| F-SRC-06 | Source Confirmation Workflow | High | Source request → confirm → submit result |

### 3.9 Quality Control

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-QC-01 | Quality Results Table | High | Cargo, surveyor, sampling date, status, spec |
| F-QC-02 | Summary Cards per Status | Medium | 7 status: pending, passed, warning, dll. |
| F-QC-03 | Multi-Stage Spec Comparison | Very High | 7 set spec (Result, Contract, Source, QC, PSI, COA POL, COA POD) |
| F-QC-04 | Document Upload per Stage | High | Upload QC/PSI/COA documents |
| F-QC-05 | Quality Comparison Output | Very High | Passed/Warning/Need Review/Claim Potential/Rejected |

### 3.10 Blending Simulator

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-BLD-01 | Dynamic Cargo Input Table | Medium | Tambah/hapus cargo rows |
| F-BLD-02 | Load from Source | Medium | Auto-fill spec dari supplier database |
| F-BLD-03 | Live Preview Calculation | Medium | Real-time weighted average |
| F-BLD-04 | Simulate Blend | Medium | Jalankan simulasi resmi dan simpan |
| F-BLD-05 | Blending History | Low | Riwayat simulasi sebelumnya |

### 3.11 Meetings & MOM

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-MTG-01 | Meeting CRUD | Medium | Create, edit, list meetings |
| F-MTG-02 | Audio Recording & Upload | Medium | Rekam atau upload audio |
| F-MTG-03 | AI Transcription (Groq) | Medium | Transcribe audio via AI |
| F-MTG-04 | Video MOM Processing | Medium | Upload video → auto pipeline (extract, transcribe, MOM, PDF) |
| F-MTG-05 | AI Task Extraction | Medium | Extract action items dari MOM |
| F-MTG-06 | PDF Export (jsPDF) | Medium | Generate MOM PDF |
| F-MTG-07 | Google Calendar Integration | Low | Link Add to Calendar |

### 3.12 AI Excel Agent

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-AI-01 | Excel Context Parser | Low | Auto-parse Excel files di project |
| F-AI-02 | Chat Interface | Low | Natural language Q&A tentang data Excel |
| F-AI-03 | Context Index Display | Low | Tampilkan workbook/sheet/headers |

### 3.13 Document Drive

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-DOC-01 | Aggregated Document List | High | Repository seluruh dokumen dari semua modul |
| F-DOC-02 | Filter & Search | High | Search, source filter, group filter |
| F-DOC-03 | Summary Cards per Source | Medium | Count per kategori dokumen |
| F-DOC-04 | Open/Download Actions | High | Buka preview atau download dokumen |

### 3.14 Partners & Directory

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-DIR-01 | Directory Cards Grid | Medium | Card per partner (buyer/vendor/fleet) |
| F-DIR-02 | Type Filter & Search | Medium | Tab filter + search |
| F-DIR-03 | Add/Edit Partner Form | Medium | Form data partner + legal docs |
| F-DIR-04 | AI Due Diligence | Low | AI risk analysis per partner |
| F-DIR-05 | Legal Document Expiry | Medium | Tracking masa berlaku dokumen legal |

### 3.15 Transshipment & Freight

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-TSH-01 | Summary Metrics | Medium | 5 metrik: shipments, revenue, profit, freight, volume |
| F-TSH-02 | Active Voyages (Card/List) | Medium | Vessel cards dengan route progress |
| F-TSH-03 | Milestone Updates | Medium | Timeline tracking per voyage |
| F-TSH-04 | Allocate Vessel Form | Medium | Form pendaftaran vessel baru |
| F-TSH-05 | AI Risk Insight | Low | AI risk analysis per route |

### 3.16 Tasks

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-TSK-01 | Kanban Board (4 kolom) | Medium | Todo, In Progress, Review, Done |
| F-TSK-02 | Drag & Drop | Medium | Pindah task antar kolom |
| F-TSK-03 | Task Detail Dialog | Medium | Description, comments, WhatsApp reminder |
| F-TSK-04 | Add/Edit Task | Medium | Title, description, assignee, priority, due date |
| F-TSK-05 | Summary Cards | Low | Count per status |

### 3.17 Profit & Loss

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-PL-01 | Summary Cards (4 metrik) | Medium | Revenue, Expense, Net Profit, Margin |
| F-PL-02 | Income vs Expense Chart | Medium | Bar chart ganda per bulan |
| F-PL-03 | Net Profit Trend | Medium | Line chart trend |
| F-PL-04 | Period Toggle | Medium | Monthly / Quarterly |
| F-PL-05 | Auto-pull Data | High | Otomatis tarik dari shipment, payment, freight, expenses |

### 3.18 Expenses / Purchase Requests

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-EXP-01 | Expense Data Table | Medium | Item, category, amount, priority, status |
| F-EXP-02 | Add New Expense | Medium | Form: description, amount, category, supplier, image |
| F-EXP-03 | Approval Workflow | Medium | Submit → Approve/Reject (Manager) |
| F-EXP-04 | Image Upload & Preview | Medium | Foto nota/invoice upload dan preview |

### 3.19 User Management

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-USR-01 | User Data Table | High | Name, email, role, change role dropdown |
| F-USR-02 | Role Change (CEO only) | High | Instant role update via dropdown |
| F-USR-03 | Access Control | High | Hanya CEO yang bisa akses halaman ini |

### 3.20 Production Readiness

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-PRD-01 | Health Check Dashboard | Low | Pass/Warn/Fail per komponen |
| F-PRD-02 | Checklist Items | Low | Database, env vars, storage, sync status |
| F-PRD-03 | Overall Status Banner | Low | PASS/WARN/FAIL global |

### 3.21 Audit Logs

| ID | Feature | Priority | Deskripsi |
|----|---------|----------|-----------|
| F-AUD-01 | Log Data Table | High | User, role, action, entity, details, date |
| F-AUD-02 | Search & Filter | Medium | Filter by user, action, entity |
| F-AUD-03 | Log Detail View | Medium | Parsed JSON detail perubahan |

---

## 4. User Flow Utama (End-to-End)

### Flow 1: Deal to Shipment Pipeline

```
Trader mengecek Market Price
    → Buat Forecast Sales (draft offer)
    → Lengkapi offer profile (buyer, spec, price, supplier candidates)
    → Submit ke CEO untuk approval
    → CEO review → Approve / Reject / Request Revision
    → Generate FCO (PDF)
    → Kirim FCO ke buyer → Record feedback
    → Buyer accept → Status: Deal
    → Convert to Shipment (auto/one-click)
    → Shipment ID dibuat di Shipment Monitor
```

### Flow 2: Shipment Execution

```
Shipment created (Upcoming)
    → Source Team konfirmasi source/supplier
    → Quality Team input QC/PSI
    → Sales/Traffic issue SI (H-10 rule)
    → Vessel/Barge nomination
    → Loading process (POL timeline)
    → BL Date → In Transit
    → Quality Team input COA POL/POD
    → Discharge (POD timeline)
    → Document processing (11 jenis checklist)
    → Payment tracking
    → Closing checklist validation
    → Shipment Closed
```

### Flow 3: Dashboard Monitoring

```
Management buka Dashboard
    → Lihat alert/blocker (source pending, quality warning, doc aging, payment overdue)
    → Klik blocker → navigasi ke modul terkait
    → Review approval queue → approve/reject
    → Monitor shipment aktif
    → Review P&L summary
```

---

## 5. Priority Matrix

| Priority | Modul | Alasan |
|----------|-------|--------|
| **Very High** | Shipment Monitor, Forecast Sales, Authentication | Core workflow utama |
| **High** | Dashboard, Market Price, Sales Monitor, Source, Quality, Payment, Document, Audit | Supporting critical operations |
| **Medium** | Blending, Meetings, Tasks, Transshipment, P&L, Expenses, Directory | Secondary features |
| **Low** | AI Agent, Production Readiness | Supporting tools |

---

## 6. Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Feature Parity | 100% | Semua fitur v1 yang sudah ACC tercakup |
| Page Load Time | < 2 detik | Dashboard dan tabel utama |
| Data Integrity | 100% | Tidak ada data loss saat migrasi |
| Revision Traceability | 100% | Semua perubahan source/barge/SI/price tercatat |
| Closing Compliance | 100% | Shipment tidak bisa close tanpa data lengkap |
| User Adoption | > 90% | Tim menggunakan sistem vs Excel |

---

## 7. Out of Scope

- Integrasi akuntansi eksternal penuh
- Bank API reconciliation otomatis
- OCR dokumen legal tingkat lanjut
- E-signature formal
- Full vessel tracking AIS
- Public customer portal
- Mobile native app (web responsive cukup)

---

## 8. Dependencies & Constraints

### Dependencies
- **PostgreSQL database** — Data persistence utama
- **Groq AI API** — Untuk market scraping, transcription, task extraction, due diligence
- **Google Calendar API** — Integrasi meeting
- **Vercel** — Deployment platform

### Constraints
- **Role-based access** harus diterapkan di semua modul
- **Bahasa UI** — English (mengikuti v1)
- **Browser support** — Chrome, Firefox, Edge (modern browsers)
- **Data migration** — Harus mempertahankan data dari v1
- **Backward compatibility** — Internal reference "Projects" tetap bekerja untuk data lama

---

*Dokumen ini menjadi acuan produk untuk seluruh fitur yang harus tersedia di CoalTrade OS Rewrite.*

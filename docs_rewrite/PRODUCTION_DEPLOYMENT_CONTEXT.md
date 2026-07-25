# CoalTrade OS — Production Deployment Context

> [!IMPORTANT]
> **DOKUMEN REVOLUSI DEPLOYMENT — DIBACA OLEH SELURUH AI AGENT & DEVELOPER**  
> Aplikasi CoalTrade OS v2 telah **100% TERDEPLOY & OPERASIONAL DI PRODUCTION (VPS)**.  
> Gunakan informasi di bawah ini sebagai konteks utama saat melanjutkan pengerjaan atau refactoring.

---

## 🟢 Status Deployment & Akses Production

| Parameter | Detail |
|-----------|--------|
| **Status Production** | **DEPLOYED & LIVE ✅** |
| **Production URL** | `https://coaltrade.gamblingslayer.site` |
| **Lokasi App di VPS** | `/opt/coaltrade/app/prodprod` |
| **Process Manager** | PM2 Cluster Mode (2 instances, app name: `coaltrade-os`) |
| **Ingress / Tunnel** | Cloudflare Tunnel (`cloudflared` service) — HTTPS Automatic SSL |
| **Port Internal** | `127.0.0.1:3000` (dilarang membuka port 80/443 publik di VPS) |

---

## 🗄️ Arsitektur Infrastruktur (Self-Hosted)

### 1. Database PostgreSQL 16 & PgBouncer
- **Database Engine**: Self-Hosted PostgreSQL 16 di VPS (Database: `coaltrade_production`).
- **Connection Pooler**: PgBouncer di port `6543` (mode: `transaction`).
- **Runtime App URL (`DATABASE_URL`)**: `postgresql://coaltrade_app:PASS@127.0.0.1:6543/coaltrade_production?pgbouncer=true`
- **Migration Direct URL (`DIRECT_URL`)**: `postgresql://coaltrade_app:PASS@127.0.0.1:5432/coaltrade_production`
- **Indeks DB**: 14 indeks komposit terpasang pada 7 tabel kritis (`shipments`, `forecast_projects`, `audit_logs`, `market_prices`, `outstanding_payments`, `tasks`, `sources`).

### 2. Three-Tier Caching System
- **Tier 1 (Client)**: React Query (staleTime 5m, gcTime 10m).
- **Tier 2 (Server)**: Redis 7 Local VPS (`REDIS_URL="redis://:PASS@127.0.0.1:6379"`). Mendukung dual-mode (ioredis / Upstash) dengan fallback aman jika Redis down.
- **Tier 3 (DB)**: PostgreSQL via PgBouncer.

### 3. Keamanan & Rate Limiting
- **Security Headers (`next.config.ts`)**: HSTS (63072000s), X-Frame-Options (SAMEORIGIN), CSP, Permissions-Policy, XSS Protection, `poweredByHeader: false`, `output: "standalone"`.
- **API Rate Limiter (`src/lib/rate-limit.ts`)**:
  - Auth (`/api/auth/*`): 10 request / 15 menit
  - General API (`/api/*`): 60 request / menit
  - Cron endpoints: 2 request / menit
- **Auth & JWT**: NextAuth.js JWT strategy dengan `NEXTAUTH_SECRET` acak 32-byte, bcrypt rounds 14 untuk user produksi.

---

## 🛠️ Perintah Operations & Script Deployment VPS

Seluruh script otomatisasi berada di folder `deploy/`:

```bash
# 1. Deploy Update Otomatis (Zero-Downtime)
/opt/coaltrade/app/prodprod/deploy/deploy.sh

# 2. Cek Status Process PM2
pm2 status
pm2 logs coaltrade-os --lines 50

# 3. Reload Aplikasi (Zero-Downtime)
pm2 reload coaltrade-os

# 4. Backup Database Otomatis (Jalan via Cron jam 02:00 AM)
/opt/coaltrade/app/prodprod/deploy/backup.sh

# 5. Automated Healthcheck Cron (Jalan tiap 5 menit)
/opt/coaltrade/app/prodprod/deploy/healthcheck.sh
```

---

## 📌 Perbaikan Terbaru yang Telah Live di Production

1. **Tasks API Status Method Fix (`src/app/api/tasks/[id]/status/route.ts`)**:
   - Menambahkan handler `PATCH` & `PUT` untuk menyelesaikan error HTTP 405 pada Kanban drag-and-drop & status toggle.
2. **Tasks API Schema & User Fallback (`src/app/api/tasks/route.ts`)**:
   - Menghapus validasi `.uuid()` kaku pada `assigneeId`, `dueDate`, dan `relatedId`.
   - Mengubah string kosong (`""`) menjadi `null` secara otomatis.
   - Pengecekan user di `prisma.user.findUnique`; jika ID user tidak ada, diset aman ke `null` untuk mencegah error 422 & Foreign Key.
3. **Tasks Assignee Selection UI (`src/modules/tasks/components/task-form-modal.tsx`)**:
   - Mengganti input teks manual UUID dengan **User Selection Dropdown**.
   - UI menampilkan `Nama User (Role)` (contoh: `Guntur (CEO)`), sementara logika mengirimkan `UUID` (`u.id`).
4. **Users GET API Access (`src/app/api/users/route.ts`)**:
   - `GET /api/users` dibuka untuk seluruh user terautentikasi agar dapat mengambil opsi dropdown assignee task. `POST` pembuatan user tetap terproteksi CEO/DIRUT.

---

## 💡 Petunjuk untuk AI Agent Lainnya

1. **Jangan mengubah `output: "standalone"`** pada `next.config.ts` karena ini dibutuhkan untuk VPS build.
2. **Jangan menghapus `pgbouncer=true`** pada `DATABASE_URL`.
3. **Setiap ada update kode baru**:
   - Commit & push dari lokal ke `origin main`.
   - Jalankan `/opt/coaltrade/app/prodprod/deploy/deploy.sh` di VPS.
4. **Local File Storage (`./uploads/`)**: EXEC-057 menambahkan sistem penyimpanan file binary lokal di `./uploads/` relatif terhadap `process.cwd()` (app root VPS). Folder ini **harus ada** dan **writable oleh user PM2** sebelum deploy pertama dengan fitur upload. Buat via: `mkdir -p /opt/coaltrade/app/prodprod/uploads && chown -R coaltrade:coaltrade /opt/coaltrade/app/prodprod/uploads`
5. **Summary Report Button** (`src/modules/forecast-sales/components/summary-report-button.tsx`): Komponen ini sudah dibuat tapi belum di-integrate ke Forecast detail drawer/page. Agent berikutnya perlu import dan render `<SummaryReportButton forecastId={project.id} />` di sidebar atau action area forecast detail.

---

## 📦 Migrations yang Perlu Dijalankan di VPS

```bash
# Di /opt/coaltrade/app/prodprod, jalankan:
npx prisma migrate deploy
```

Dibutuhkan untuk: `ForecastSupplierCandidate`, `GeneratedDocument`, `FCORecord`, `ForecastRevision` models yang ditambahkan sejak EXEC-054/055.


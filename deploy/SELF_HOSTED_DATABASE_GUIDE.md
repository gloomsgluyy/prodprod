# Panduan Deployment Self-Hosted PostgreSQL & PgBouncer untuk CoalTrade OS

Panduan langkah demi langkah untuk melakukan deployment database PostgreSQL milik sendiri di VPS (tanpa Supabase), lengkap dengan setup **PgBouncer (Connection Pooler)**, migrasi schema Prisma, restore data dari backup, serta tuning performa & backup otomatis.

---

## 📋 Daftar Langkah

1. [Install & Setup PostgreSQL 16 di VPS](#1-install--setup-postgresql-16-di-vps)
2. [Membuat Database & User Application](#2-membuat-database--user-application)
3. [Install & Konfigurasi PgBouncer (Connection Pooler)](#3-install--konfigurasi-pgbouncer-connection-pooler)
4. [Konfigurasi Environment Variables (.env)](#4-konfigurasi-environment-variables-env)
5. [Migrasi Schema Prisma & Restore Data](#5-migrasi-schema-prisma--restore-data)
6. [Tuning Performa PostgreSQL (Production Grade)](#6-tuning-performa-postgresql-production-grade)
7. [Setup Backup Otomatis Harian](#7-setup-backup-otomatis-harian)

---

## 1. Install & Setup PostgreSQL 16 di VPS

Jalankan perintah berikut di VPS (Ubuntu 22.04 / 24.04 LTS):

```bash
# 1. Update paket & tambahkan repository resmi PostgreSQL
sudo apt update && sudo apt install -y curl ca-certificates lsb-release gnupg
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# 2. Install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# 3. Pastikan PostgreSQL berjalan
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

---

## 2. Membuat Database & User Application

Masuk ke PostgreSQL CLI sebagai user `postgres` dan buat database serta user khusus aplikasi:

```bash
sudo -u postgres psql
```

Jalankan SQL query berikut (ganti `'PASSWORD_SANGAT_RAHASIA_DI_SINI'` dengan password kuat pilihan Anda):

```sql
-- 1. Atur password superuser postgres
ALTER USER postgres WITH PASSWORD 'PASSWORD_SUPERUSER_POSTGRES';

-- 2. Buat database produksi
CREATE DATABASE coaltrade_production;

-- 3. Buat user aplikasi (coaltrade_app)
CREATE USER coaltrade_app WITH ENCRYPTED PASSWORD 'PASSWORD_SANGAT_RAHASIA_DI_SINI';

-- 4. Berikan hak akses penuh ke database coaltrade_production
GRANT ALL PRIVILEGES ON DATABASE coaltrade_production TO coaltrade_app;

-- 5. Pindah ke database coaltrade_production dan berikan akses schema public
\c coaltrade_production
GRANT ALL ON SCHEMA public TO coaltrade_app;
ALTER SCHEMA public OWNER TO coaltrade_app;

-- Keluar dari psql
\q
```

---

## 3. Install & Konfigurasi PgBouncer (Connection Pooler)

> [!IMPORTANT]
> **Mengapa PgBouncer Wajib?**
> Next.js berjalan dalam mode serverless/standalone di mana setiap request API dapat membuka koneksi baru. Tanpa PgBouncer, PostgreSQL akan dengan cepat kehabisan koneksi (`FATAL: sorry, too many clients already`). PgBouncer menghemat dan mendaur ulang koneksi database secara efisien.

### 3.1 Install PgBouncer

```bash
sudo apt install -y pgbouncer
```

### 3.2 Dapatkan Hash MD5 Password User `coaltrade_app`

PgBouncer memerlukan hash password md5 dalam format `md5 + md5(password + username)`:

```bash
# Jalankan perintah ini di terminal VPS (ganti PASSWORD_SANGAT_RAHASIA_DI_SINI):
echo -n "PASSWORD_SANGAT_RAHASIA_DI_SINIncoaltrade_app" | md5sum
```

Contoh output: `e10adc3949ba59abbe56e057f20f883e -`  
Maka hash lengkapnya adalah: `md5e10adc3949ba59abbe56e057f20f883e`.

### 3.3 Buat File Authentication PgBouncer

Edit file `/etc/pgbouncer/userlist.txt`:

```bash
sudo nano /etc/pgbouncer/userlist.txt
```

Isi dengan:
```text
"coaltrade_app" "md5e10adc3949ba59abbe56e057f20f883e"
```

### 3.4 Edit File Konfigurasi `/etc/pgbouncer/pgbouncer.ini`

```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```

Ganti isinya dengan konfigurasi produksi berikut:

```ini
[databases]
coaltrade_production = host=127.0.0.1 port=5432 dbname=coaltrade_production

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6543
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 0
log_disconnections = 0
stats_period = 60
```

### 3.5 Restart & Enable PgBouncer

```bash
sudo systemctl enable pgbouncer
sudo systemctl restart pgbouncer
sudo systemctl status pgbouncer
```

---

## 4. Konfigurasi Environment Variables (.env)

Di direktori aplikasi `/opt/coaltrade/app/.env`, atur `DATABASE_URL` dan `DIRECT_URL`:

```env
# ── DATABASE CONNECTION ───────────────────────────────────────────────────────

# DATABASE_URL menggunakan port PgBouncer (6543) + flag ?pgbouncer=true
# Digunakan oleh Next.js runtime untuk query aplikasi sehari-hari
DATABASE_URL="postgresql://coaltrade_app:PASSWORD_SANGAT_RAHASIA_DI_SINI@127.0.0.1:6543/coaltrade_production?pgbouncer=true"

# DIRECT_URL menggunakan port langsung PostgreSQL (5432)
# WAJIB digunakan oleh Prisma Migrations & Schema Changes (PgBouncer mode transaction tidak mendukung DDL migration)
DIRECT_URL="postgresql://coaltrade_app:PASSWORD_SANGAT_RAHASIA_DI_SINI@127.0.0.1:5432/coaltrade_production"

# ── NEXTAUTH & SECRETS ────────────────────────────────────────────────────────
NEXTAUTH_URL="https://domain-anda.com"
NEXTAUTH_SECRET="RAHASIA_SUPER_RANDOM_BASE64_32_BYTE"
```

---

## 5. Migrasi Schema Prisma & Restore Data

### 5.1 Jalankan Migrasi Schema Prisma

Jalankan perintah ini di direktori project untuk membuat seluruh tabel (30+ tabel) di PostgreSQL milik Anda sendiri:

```bash
cd /opt/coaltrade/app

# 1. Jalankan migrasi Prisma (membuat tabel & indeks ke database lokal)
npx prisma migrate deploy

# 2. Generate Prisma Client terbaru
npx prisma generate
```

### 5.2 Populate Data Awal / Restore Data Backup

Anda dapat mengisi data awal menggunakan salah satu metode berikut:

#### Opsional A: Import dari JSON Backup yang Ada (`CoalOS_DB_Backup_*`)
Project ini sudah dilengkapi dengan script pendukung `seed-from-backup.ts`:

```bash
npx tsx scripts/seed-from-backup.ts
```

#### Opsional B: Buat User Production Utama (CEO Account)
Gunakan script pembuat user produksi yang sudah disiapkan:

```bash
npx tsx scripts/create-production-user.ts "PasswordKuatMinimal12Char!" "ceo@perusahaan.com" "Nama CEO" "CEO"
```

---

## 6. Tuning Performa PostgreSQL (Production Grade)

Untuk memaksimalkan kecepatan query batubara, audit log, dan dashboard, optimalkan file `/etc/postgresql/16/main/postgresql.conf`:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Sesuaikan nilai berikut (asumsi VPS 4 GB - 8 GB RAM):

```ini
# Memory Tuning
shared_buffers = 2GB                  # 25% dari total RAM VPS
effective_cache_size = 6GB            # 75% dari total RAM VPS
work_mem = 16MB
maintenance_work_mem = 512MB

# Checkpoint & WAL Tuning
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Planner (Optimasi SSD/NVMe)
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging Slow Queries (> 1 detik)
log_min_duration_statement = 1000
```

Terapkan perubahan dengan merestart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 7. Setup Backup Otomatis Harian

Gunakan script backup otomatis yang sudah dibuat di folder `deploy/backup.sh`.

### 7.1 Pastikan Script Backup Dapat Dieksekusi

```bash
chmod +x /opt/coaltrade/app/deploy/backup.sh
```

### 7.2 Pasang Cron Job Harian (Jam 02:00 Malam)

```bash
sudo crontab -e
```

Tambahkan baris berikut di paling bawah:

```cron
0 2 * * * /opt/coaltrade/app/deploy/backup.sh >> /var/log/coaltrade-backup.log 2>&1
```

Script ini akan:
- Membuat dump database terkompresi `.dump` setiap jam 2 pagi.
- Menyimpan hasil backup di `/opt/coaltrade/backups/`.
- Menghapus otomatis backup yang usianya lebih dari 30 hari.

### 7.3 Cara Restore Database dari Dump Backup (Jika Diperlukan)

Jika ingin melakukan restore dari file dump di masa depan:

```bash
pg_restore -U coaltrade_app -d coaltrade_production --clean --if-exists /opt/coaltrade/backups/coaltrade_production_YYYY-MM-DD_HH-MM-SS.dump
```

---

## 🏁 Verifikasi Akhir

Setelah semua langkah di atas selesai, jalankan tes koneksi dan status service:

```bash
# 1. Tes koneksi langsung ke Postgres (Port 5432)
psql -h 127.0.0.1 -p 5432 -U coaltrade_app -d coaltrade_production -c "SELECT COUNT(*) FROM users;"

# 2. Tes koneksi melalui PgBouncer Pooler (Port 6543)
psql -h 127.0.0.1 -p 6543 -U coaltrade_app -d coaltrade_production -c "SELECT COUNT(*) FROM shipments;"

# 3. Jalankan aplikasi via PM2
pm2 restart coaltrade-os
```

Jika query mengembalikan angka dan PM2 berstatus `online`, maka **Self-Hosted Database PostgreSQL + PgBouncer** Anda telah beroperasi 100% secara **Production-Grade**!

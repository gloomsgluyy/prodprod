# Panduan End-to-End Setup Server VPS & Cloudflare Tunnel — CoalTrade OS

Panduan lengkap ini menuntun Anda dari **nol (VPS baru)**, git clone project, setup database, build aplikasi Next.js, manajemen proses dengan PM2, hingga **Tunneling HTTPS dengan Cloudflare Tunnel (`cloudflared`)** tanpa perlu muka port publik 80/443 atau setup SSL manual.

---

## 📑 Daftar Isi

1. [Fase 1: Persiapan Server VPS & Keamanan Dasar](#fase-1-persiapan-server-vps--keamanan-dasar)
2. [Fase 2: Install Node.js 20 LTS & PM2](#fase-2-install-nodejs-20-lts--pm2)
3. [Fase 3: Git Clone & Konfigurasi Aplikasi](#fase-3-git-clone--konfigurasi-aplikasi)
4. [Fase 4: Setup Database PostgreSQL & Migrasi Prisma](#fase-4-setup-database-postgresql--migrasi-prisma)
5. [Fase 5: Build Production & Running dengan PM2](#fase-5-build-production--running-dengan-pm2)
6. [Fase 6: Setup Tunneling dengan Cloudflare Tunnel (cloudflared)](#fase-6-setup-tunneling-dengan-cloudflare-tunnel-cloudflared)
7. [Fase 7: Verifikasi & Auto-Start Saat VPS Reboot](#fase-7-verifikasi--auto-start-saat-vps-reboot)

---

## Fase 1: Persiapan Server VPS & Keamanan Dasar

### 1.1 Update Paket Sistem

Masuk ke VPS via SSH sebagai `root`:

```bash
ssh root@IP_VPS_ANDA
```

Jalankan update sistem:

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip ufw fail2ban ca-certificates
```

### 1.2 Buat User Non-Root (`coaltrade`)

```bash
# 1. Buat user baru bernama coaltrade
adduser coaltrade

# 2. Berikan akses sudo
usermod -aG sudo coaltrade

# 3. Pindah ke user coaltrade
su - coaltrade
```

### 1.3 Amankan Firewall (UFW)

Karena kita menggunakan **Cloudflare Tunnel**, VPS **TIDAK PERLU** membuka port 80 atau 443 ke publik! Cukup buka port SSH (22):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp          # Port SSH
sudo ufw enable
```

---

## Fase 2: Install Node.js 20 LTS & PM2

### 2.1 Install Node.js 20 LTS (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v   # Harus v20.x.x
npm -v
```

### 2.2 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

---

## Fase 3: Git Clone & Konfigurasi Aplikasi

### 3.1 Buat Folder Direktori Aplikasi

```bash
sudo mkdir -p /opt/coaltrade/app
sudo chown -R coaltrade:coaltrade /opt/coaltrade
cd /opt/coaltrade/app
```

### 3.2 Clone Repository Git

```bash
# Clone repository Anda (ganti URL repository dengan repo Anda)
git clone https://github.com/USERNAME/REPO_NAME.git .
```

### 3.3 Install Dependencies

```bash
npm ci --omit=dev
```

### 3.4 Buat File Environment (`.env`)

Buat file `.env` produksi di direktori `/opt/coaltrade/app/.env`:

```bash
nano /opt/coaltrade/app/.env
```

Isi dengan variabel produksi berikut:

```env
# ── DATABASE ──────────────────────────────────────────────────────────────────
# Menggunakan PgBouncer (Port 6543) untuk runtime Next.js
DATABASE_URL="postgresql://coaltrade_app:PASSWORD_DATABASE_KUAT@127.0.0.1:6543/coaltrade_production?pgbouncer=true"
# Connection langsung (Port 5432) untuk Prisma Migrations
DIRECT_URL="postgresql://coaltrade_app:PASSWORD_DATABASE_KUAT@127.0.0.1:5432/coaltrade_production"

# ── NEXTAUTH & SECRETS ────────────────────────────────────────────────────────
# Domain yang di-route via Cloudflare Tunnel
NEXTAUTH_URL="https://coaltrade.domainanda.com"
# Generate secret dengan: openssl rand -base64 32
NEXTAUTH_SECRET="INSERT_RANDOM_BASE64_SECRET_32_BYTES_DISINI"

# ── REDIS (CACHE LOKAL VPS) ───────────────────────────────────────────────────
REDIS_URL="redis://:REDIS_PASSWORD@127.0.0.1:6379"

# ── GROQ AI & CRON ────────────────────────────────────────────────────────────
GROQ_API_KEY="gsk_..."
CRON_SECRET="INSERT_RANDOM_HEX_SECRET_DISINI"

# ── ENVIRONMENT ───────────────────────────────────────────────────────────────
NODE_ENV="production"
```

---

## Fase 4: Setup Database PostgreSQL & Migrasi Prisma

> [!NOTE]
> Ikuti panduan rinci database self-hosted di `deploy/SELF_HOSTED_DATABASE_GUIDE.md`. Berikut ringkasannya:

### 4.1 Install PostgreSQL 16 & PgBouncer (Single Command Setup)

```bash
# Install PostgreSQL 16 & PgBouncer
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16 pgbouncer redis-server

# Setup Database & User SQL
sudo -u postgres psql <<EOF
CREATE DATABASE coaltrade_production;
CREATE USER coaltrade_app WITH ENCRYPTED PASSWORD 'PASSWORD_DATABASE_KUAT';
GRANT ALL PRIVILEGES ON DATABASE coaltrade_production TO coaltrade_app;
\c coaltrade_production
GRANT ALL ON SCHEMA public TO coaltrade_app;
EOF
```

### 4.2 Jalankan Migrasi Prisma & Seed User Production

```bash
cd /opt/coaltrade/app

# 1. Migrate schema ke database PostgreSQL VPS
npx prisma migrate deploy

# 2. Generate Prisma Client
npx prisma generate

# 3. Buat User CEO Production Pertama
npx tsx scripts/create-production-user.ts "PasswordSuperAman123!@#" "ceo@perusahaan.com" "CEO Nama" "CEO"
```

---

## Fase 5: Build Production & Running dengan PM2

### 5.1 Build Aplikasi Next.js

```bash
cd /opt/coaltrade/app
npm run build
```

Hasil build akan menghasilkan bundle produksi yang dioptimalkan di `.next/standalone`.

### 5.2 Jalankan Aplikasi via PM2 Cluster Mode

Gunakan file [deploy/ecosystem.config.js](file:///C:/CoalTrade-Production/deploy/ecosystem.config.js) yang sudah tersedia:

```bash
# Buat folder log
sudo mkdir -p /var/log/coaltrade
sudo chown -R coaltrade:coaltrade /var/log/coaltrade

# Jalankan PM2
pm2 start deploy/ecosystem.config.js

# Simpan state PM2
pm2 save
```

Cek status aplikasi:

```bash
pm2 status
```

Aplikasi Next.js Anda sekarang berjalan di `http://127.0.0.1:3000`.

---

## Fase 6: Setup Tunneling dengan Cloudflare Tunnel (`cloudflared`)

> [!TIP]
> **Mengapa Cloudflare Tunnel?**
> 1. **Tanpa Port Publik**: VPS Anda tidak perlu membuka port 80/443 ke internet.
> 2. **SSL Otomatis**: Sertifikat HTTPS dikelola otomatis oleh Cloudflare.
> 3. **Perlindungan DDoS & WAF**: Trafik disaring oleh firewall Cloudflare sebelum mencapai VPS.
> 4. **Gratis & Tanpa IP Publik Statis**: Bekerja bahkan di balik NAT / CGNAT.

### 6.1 Prasyarat Cloudflare

- Anda sudah memiliki akun Cloudflare.
- Domain Anda (misal: `domainanda.com`) sudah terhubung dan aktif di Cloudflare.

### 6.2 OPSI A: Setup via Cloudflare Dashboard (Sangat Direkomendasikan & Paling Mudah)

1. Buka [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Buka menu **Networks** → **Tunnels** → Klik **Create a Tunnel**.
3. Pilih **Cloudflared** → Beri nama tunnel (contoh: `coaltrade-vps`).
4. Pilih OS **Debian / Ubuntu** (64-bit).
5. Cloudflare akan memberikan perintah install otomatis berupa baris perintah `curl ...`. Salin dan jalankan perintah tersebut di terminal VPS Anda:

```bash
# Contoh perintah yang diberikan Cloudflare Dashboard:
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
sudo cloudflared service install eyJhY... (token rahasia dari dashboard Anda)
```

6. Di Cloudflare Dashboard, pada tab **Public Hostname**:
   - **Subdomain**: `coaltrade` (atau kosongkan untuk root domain)
   - **Domain**: `domainanda.com`
   - **Type**: `HTTP`
   - **URL**: `localhost:3000`
7. Klik **Save Tunnel**.

Selesai! `cloudflared` otomatis berjalan sebagai `systemd service` di latar belakang dan mempublikasikan aplikasi lokal port 3000 Anda ke HTTPS `https://coaltrade.domainanda.com`.

---

### 6.3 OPSI B: Setup via CLI Terminal VPS

Jika Anda lebih memilih setup manual melalui CLI tanpa browser Dashboard:

```bash
# 1. Download & Install cloudflared CLI
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Login ke akun Cloudflare (akan memberikan URL authorization)
cloudflared tunnel login
# Buka URL yang muncul di browser Anda dan pilih domain Anda.

# 3. Buat Tunnel Baru
cloudflared tunnel create coaltrade-tunnel
# Catat Tunnel ID (UUID) yang dihasilkan!

# 4. Hubungkan Subdomain ke Tunnel
cloudflared tunnel route dns coaltrade-tunnel coaltrade.domainanda.com

# 5. Buat File Konfigurasi /etc/cloudflared/config.yml
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Isi `/etc/cloudflared/config.yml` (ganti `TUNNEL_ID_ANDA` dan `domainanda.com`):

```yaml
tunnel: TUNNEL_ID_ANDA
credentials-file: /root/.cloudflared/TUNNEL_ID_ANDA.json

ingress:
  - hostname: coaltrade.domainanda.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# 6. Install cloudflared sebagai Systemd Service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## Fase 7: Verifikasi & Auto-Start Saat VPS Reboot

### 7.1 Pastikan Service PM2 & Cloudflared Auto-Start

Jalankan perintah ini agar saat VPS di-restart/reboot, seluruh sistem menyala otomatis tanpa intervensi manual:

```bash
# Setup PM2 Startup
pm2 startup ubuntu -u coaltrade --hp /home/coaltrade
pm2 save

# Pastikan Cloudflare Tunnel aktif
sudo systemctl enable cloudflared
```

### 7.2 Tes Akses Aplikasi

Buka browser dan navigasi ke URL domain Anda:
```text
https://coaltrade.domainanda.com
```

Anda akan melihat halaman **Login CoalTrade OS** dengan koneksi gembok **HTTPS SSL Aman** yang diproteksi oleh Cloudflare!

---

## 🛠️ Perintah Perawatan Sehari-hari (Quick Cheat Sheet)

| Aksi | Perintah |
|------|----------|
| **Cek status aplikasi Next.js** | `pm2 status` |
| **Cek log real-time aplikasi** | `pm2 logs coaltrade-os` |
| **Deploy update kode terbaru (Zero-Downtime)** | `./deploy/deploy.sh` |
| **Cek status Cloudflare Tunnel** | `sudo systemctl status cloudflared` |
| **Cek log Cloudflare Tunnel** | `sudo journalctl -u cloudflared -f` |
| **Restart aplikasi** | `pm2 reload coaltrade-os` |
| **Cek penggunaan RAM/CPU** | `pm2 monit` |

---

🎉 **Selamat! Server VPS CoalTrade OS Anda kini beroperasi dengan arsitektur Production-Grade, aman dibalik Cloudflare Tunnel HTTPS!**

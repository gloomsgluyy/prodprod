# Modul: User Management

**Route:** `/users`  
**File:** `src/app/users/page.tsx`  
**Akses:** Terbatas (Hanya CEO)  
**Database:** PostgreSQL (Prisma)

---

## Deskripsi Umum

Halaman kontrol administrator untuk mengelola hak akses seluruh pengguna sistem. Karena sifatnya yang sangat kritikal, halaman ini **hanya dapat diakses oleh role CEO** dan dirender langsung dari server (Server-Side Rendering / RSC).

---

## Layout

### 1. Access Control
- Terdapat perlindungan ketat (Auth Guard). Jika rolenya bukan CEO, layar hanya menampilkan "Access Restricted: Only CEO can manage user roles."

### 2. Header
- Title: "User Management"
- Deskripsi: "Kelola role pengguna. Hanya CEO yang dapat mengubah role user lain."

### 3. User Data Table
Tabel yang merender seluruh karyawan perusahaan:

| Kolom | Deskripsi |
|-------|-----------|
| Name | Nama lengkap karyawan |
| Email | Email login karyawan |
| Current Role | Badge warna yang menunjukkan Role saat ini |
| Change Role | **Interactive Dropdown** (hanya aktif jika user adalah CEO) |

### 4. Interactive Dropdown (Change Role)
Setiap baris user memiliki komponen interaktif `UserRoleManager`:
- Merupakan Dropdown (Select) yang berisi daftar Role: `CEO`, `STAFF`, `TRAFFIC`, `QUALITY`, `FINANCE`, dll.

---

## Daftar Tombol dan Aksi

| Interaksi | Aksi |
|-----------|------|
| **Ganti Role di Dropdown** | Saat CEO memilih role baru di dropdown, sistem akan melakukan *fetch POST* ke database backend untuk memperbarui hak akses user tersebut secara instan tanpa perlu tombol "Save" terpisah. |

---

## User Flow

```
CEO buka /users
  │
  ├── Server (Next.js) memverifikasi sesi, query ke database Prisma, lalu mengirimkan HTML tabel ke browser.
  │
  ├── CEO mencari nama karyawan (misal: "Budi").
  │
  ├── CEO membuka Dropdown di sebelah nama Budi, lalu mengubah "STAFF" menjadi "MANAGER".
  │
  └── Terdapat notifikasi sukses kecil (Toast) di pojok layar, dan audit log otomatis mencatat bahwa CEO mengubah role Budi.
```

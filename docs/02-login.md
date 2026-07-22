# Modul: Login

**Route:** `/login`  
**File:** [`page.tsx`](file:///C:/Users/Glooms/Downloads/11GAWE/src/app/login/page.tsx) (138 baris, 6KB)  
**Auth:** NextAuth.js Credentials Provider  
**Akses:** Publik (halaman tanpa autentikasi)

---

## Deskripsi Umum

Halaman login sederhana yang menggunakan NextAuth.js dengan Credentials Provider untuk autentikasi berbasis email dan password. Halaman ini juga menampilkan daftar akun demo untuk kemudahan testing.

---

## Layout

### Struktur Visual
```
┌──────────────────────────────────────────┐
│              (background abu-abu)        │
│                                          │
│     ┌──────────────────────────┐         │
│     │     🔒 (Logo Circle)     │         │
│     │     "Business OS"        │         │
│     │  "Sign in to your acc."  │         │
│     │                          │         │
│     │  [Email Input]           │         │
│     │  [Password Input]        │         │
│     │  ❌ Error message        │         │
│     │  [====Sign in====]       │         │
│     │                          │         │
│     │  Demo accounts:          │         │
│     │  • admin@demo.com        │         │
│     │  • ceo@demo.com          │         │
│     └──────────────────────────┘         │
│                                          │
└──────────────────────────────────────────┘
```

### Elemen UI Detail

| Elemen | Jenis | Detail |
|--------|-------|--------|
| Logo | Circle div | Indigo-600 background, icon gembok putih |
| Title | h1 | "Business OS" — bold, centered |
| Subtitle | p | "Sign in to your account" |
| Email | Input text | Type email, placeholder, full-width |
| Password | Input text | Type password, full-width |
| Error | p (conditional) | Merah, "Invalid email or password" |
| Sign In | Button | Submit form, loading spinner saat proses |
| Demo List | Div | Daftar email/password demo (klikable auto-fill) |

---

## Daftar Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| "Sign in" | Submit credentials ke NextAuth → redirect ke `/` jika berhasil |
| Demo account item (klik) | Auto-fill email dan password dengan data demo |

---

## User Flow

```
User buka /login
  │
  ├── Masukkan email + password (manual)
  │     └── Klik "Sign in"
  │           ├── ✅ Berhasil → router.push("/") → router.refresh()
  │           └── ❌ Gagal → tampilkan "Invalid email or password"
  │
  └── Klik demo account
        └── Auto-fill email + password
              └── Klik "Sign in" → same flow
```

---

## Mekanisme Autentikasi

1. **Frontend:** `signIn("credentials", { email, password, redirect: false })`
2. **Backend:** NextAuth `authOptions` di `src/lib/auth.ts`
3. **Database:** Prisma query `User` table untuk validasi
4. **Session:** JWT-based session, tersedia via `useSession()` hook
5. **Protected Routes:** Semua route selain `/login` memerlukan session aktif

---

## Hubungan Antar Modul

| Modul Terkait | Jenis Hubungan |
|---------------|---------------|
| Semua modul | Session user digunakan untuk RBAC dan permission check |
| auth-store | `useAuthStore()` menyimpan currentUser dari session |
| User Management | Role yang diatur di `/users` mempengaruhi akses |

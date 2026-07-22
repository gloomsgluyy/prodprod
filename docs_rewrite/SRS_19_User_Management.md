# SRS Modul 19: User Management

**Modul:** User Management | **Route:** `/users` | **Versi:** 2.0
**Implementation Status:** Done — All FR-USR fully implemented

---

## 1. Overview
Manajemen user dan role assignment. Hanya accessible oleh CEO/DIRUT. Menyediakan tabel user dengan dropdown role change.

| Akses | CEO/DIRUT only |

---

## 2. Functional Requirements

### FR-USR-001: User Data Table (Status: Done)
| Kolom | Deskripsi |
|-------|-----------|
| Name | Nama user |
| Email | Email address |
| Role | Current role badge |
| Change Role | Dropdown selector |

### FR-USR-002: Instant Role Change (Status: Done)
CEO pilih role baru dari dropdown → auto-update via API. Tidak memerlukan form terpisah.

### FR-USR-003: Access Control (Status: Done)
**BR-USR-001**: Hanya `CEO` dan `DIRUT` yang bisa akses `/users`
**BR-USR-002**: Role change mempengaruhi akses di seluruh modul
**BR-USR-003**: Role change berlaku setelah user re-login

---

## 3. Data Model
Menggunakan entity `User` yang sama dari modul Authentication (lihat SRS_02).

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET | `/api/users` |
| PUT | `/api/users/:id/role` |

---

*End of SRS_19_User_Management*

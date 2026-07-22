# SRS Modul 12: AI Excel Agent

**Modul:** AI Excel Agent | **Route:** `/ai-agent` | **Versi:** 2.0
**Implementation Status:** Done — All FR-AI implemented (Groq Q&A is stub, key needed)

---

## 1. Overview
Agent AI untuk menjawab pertanyaan tentang data Excel. Auto-parse file Excel, bangun context (workbooks, sheets, headers, rows), user bisa bertanya dalam bahasa natural.

| API | `/api/ai-agent/excel-context` |

---

## 2. Functional Requirements

### FR-AI-001: Excel Context Index (Status: Done)
Summary Cards (3): Files count, Sheets count, Total Rows.
Panel kiri: Per workbook — file name, path, per sheet (name, rows, columns, headers).

### FR-AI-002: Chat Interface (Status: Done)
Panel kanan: Input pertanyaan + "Send" button. Loading indicator. Answer display (Markdown).

### FR-AI-003: Context-Aware Q&A (Status: Pending — Groq integration is stub; keyword routing exists but no real LLM call without GROQ_API_KEY)
POST ke Groq AI dengan Excel context. Contoh: "Berapa total shipment bulan ini?", "Siapa buyer terbesar?"

---

## 3. Data Model
No persistent entity — reads Excel files from filesystem at runtime.

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET | `/api/ai-agent/excel-context` (context index) |
| POST | `/api/ai-agent/excel-context` (Q&A) |

## 5. Integration Points
| Modul | Hubungan |
|-------|----------|
| File System | Reads MV_Barge and Daily_Delivery Excel files |

**Note:** AI Excel Agent is supporting tool, not main workflow.

---

*End of SRS_12_AI_Agent*

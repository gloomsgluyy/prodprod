# SRS Modul 16: Tasks (All Tasks & My Tasks)

**Modul:** Tasks | **Route:** `/all-tasks`, `/my-tasks` | **Versi:** 2.0
**Implementation Status:** Done — All FR-TSK fully implemented

---

## 1. Overview
Kanban board task management dengan 4 kolom dan drag-and-drop. Tasks bisa link ke shipment, project, issue, meeting.

| Store | `task-store` | Dependencies | @hello-pangea/dnd |

---

## 2. Functional Requirements

### FR-TSK-001: Kanban Board (4 kolom) (Status: Done)
| Kolom | Status | Border |
|-------|--------|--------|
| Todo | todo | Blue-500 |
| In Progress | in_progress | Yellow-500 |
| Review | review | Purple-500 |
| Done | done | Green-500 |

### FR-TSK-002: Drag & Drop (Status: Done)
Pindah card antar kolom menggunakan `@hello-pangea/dnd`. Auto-update status berdasarkan target kolom.

### FR-TSK-003: Task Card (Status: Done)
Per card: Priority dot (merah/kuning/biru/hijau), Title, Description (truncated), Assignee avatar, "🕓 Jul 12".

### FR-TSK-004: Task Detail Dialog (Status: Done)
Klik card → dialog: Title, Description, Priority, Status, Assigned To, Due Date, Comments, "Open in WhatsApp" button.

### FR-TSK-005: Add/Edit Task (Status: Done)
Fields: Title (required), Description, Priority (urgent/high/medium/low), Assignee, Due Date, Status.

### FR-TSK-006: Summary Cards (Status: Done)
Total tasks, In Progress, Completed, Overdue (count).

### FR-TSK-007: All Tasks vs My Tasks (Status: Done)
- `/all-tasks` → seluruh task
- `/my-tasks` → task assigned ke user login

### FR-TSK-008: Link to Module (Status: Done)
Task bisa link ke: Shipment, Forecast Sales, Issue, Meeting.

**BR-TSK-001**: Meeting action point → auto-create task
**BR-TSK-002**: Overdue task tampil di Dashboard Priority Tasks widget

---

## 3. Data Model
### Entity: Task
| Field | Type |
|-------|------|
| id | UUID |
| title | String (required) |
| description | Text |
| priority | Enum (urgent/high/medium/low) |
| status | Enum (todo/in_progress/review/done) |
| assignedTo | String |
| dueDate | Date |
| linkedModule | String |
| linkedEntityId | UUID |
| comments | JSON |
| createdAt | DateTime |
| updatedAt | DateTime |

## 4. API Endpoints
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/tasks` |
| GET/PUT/DELETE | `/api/tasks/:id` |
| PUT | `/api/tasks/:id/status` |

---

*End of SRS_16_Tasks*

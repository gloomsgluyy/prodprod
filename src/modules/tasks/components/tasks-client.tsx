"use client";

import { useTasksUIStore } from "../store/tasks-ui-store";
import { useTaskList } from "../hooks/use-tasks";
import { TaskKanban }      from "./task-kanban";
import { TaskListView }    from "./task-list-view";
import { TaskFormModal }   from "./task-form-modal";
import { TaskDetailDialog } from "./task-detail-dialog";

const PRIORITY_FILTERS = ["all","urgent","high","medium","low"];

function SummaryCards({ mine }: { mine: boolean }) {
  const statuses = ["todo","in_progress","review","done"] as const;
  const queries  = statuses.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTaskList({ mine, status: s, page: 1 })
  );
  const { data: overdueData } = useTaskList({ mine, page: 1 });
  const overdue = (overdueData?.data ?? []).filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  ).length;

  const LABELS = { todo:"Todo", in_progress:"In Progress", review:"Review", done:"Done" };
  const COLORS: Record<string, string> = {
    todo:"text-blue-500", in_progress:"text-yellow-500", review:"text-purple-500", done:"text-emerald-500",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {statuses.map((s, i) => (
        <div key={s} className="card card--stat">
          <div className="card__body">
            <p className="text-eyebrow">{LABELS[s]}</p>
            <p className={`text-2xl font-light ${COLORS[s]}`}>
              {queries[i].isLoading ? "…" : queries[i].data?.meta?.total ?? 0}
            </p>
          </div>
        </div>
      ))}
      <div className="card card--stat">
        <div className="card__body">
          <p className="text-eyebrow">Overdue</p>
          <p className="text-2xl font-light text-red-500">{overdue}</p>
        </div>
      </div>
    </div>
  );
}

export function TasksClient({ mine = false }: { mine?: boolean }) {
  const {
    viewMode, filterPriority, filterSearch, detailId, createModalOpen, editingId,
    setViewMode, setFilterPriority, setFilterSearch, setMine, openCreate,
  } = useTasksUIStore();

  return (
    <div className="flex flex-col gap-5">
      <SummaryCards mine={mine} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
          {(["kanban","list"] as const).map((v) => (
            <button key={v} type="button"
              className={`button button--sm ${viewMode===v?"button--primary":"button--ghost button--neutral"}`}
              onClick={() => setViewMode(v)} aria-pressed={viewMode===v}>
              {v==="kanban"?"Kanban":"List"}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select className="select select--sm w-32"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          aria-label="Filter by priority">
          {PRIORITY_FILTERS.map((p) => (
            <option key={p} value={p}>
              {p==="all"?"All Priority":p.charAt(0).toUpperCase()+p.slice(1)}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="input-group flex-1 min-w-48">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11.5" cy="11.5" r="9.5"/>
                <path strokeLinecap="round" d="M18.5 18.5L22 22"/>
              </g>
            </svg>
          </span>
          <input type="search" className="input"
            placeholder="Search tasks…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            aria-label="Search tasks" />
        </div>

        {/* Mine toggle — only on all-tasks page */}
        {!mine && (
          <label className="field__item">
            <input type="checkbox" className="checkbox"
              onChange={(e) => setMine(e.target.checked)} />
            <span className="text-sm">My tasks only</span>
          </label>
        )}

        <button type="button" className="button button--primary ms-auto" onClick={openCreate}>
          + New Task
        </button>
      </div>

      {/* Board or list */}
      {viewMode === "kanban"
        ? <TaskKanban mine={mine} />
        : <TaskListView mine={mine} />
      }

      {/* Overlays */}
      {(createModalOpen || editingId) && <TaskFormModal mine={mine} />}
      {detailId                        && <TaskDetailDialog mine={mine} />}
    </div>
  );
}

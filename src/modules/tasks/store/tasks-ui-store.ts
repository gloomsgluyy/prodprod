import { create } from "zustand";

type ViewMode = "kanban" | "list";

interface TasksUIState {
  viewMode:        ViewMode;
  filterPriority:  string;
  filterSearch:    string;
  mine:            boolean;
  page:            number;
  detailId:        string | null;
  createModalOpen: boolean;
  editingId:       string | null;

  setViewMode:      (v: ViewMode)    => void;
  setFilterPriority:(p: string)      => void;
  setFilterSearch:  (s: string)      => void;
  setMine:          (m: boolean)     => void;
  setPage:          (p: number)      => void;
  openDetail:       (id: string)     => void;
  closeDetail:      ()               => void;
  openCreate:       ()               => void;
  openEdit:         (id: string)     => void;
  closeCreateEdit:  ()               => void;
}

export const useTasksUIStore = create<TasksUIState>((set) => ({
  viewMode:        "kanban",
  filterPriority:  "all",
  filterSearch:    "",
  mine:            false,
  page:            1,
  detailId:        null,
  createModalOpen: false,
  editingId:       null,

  setViewMode:       (v) => set({ viewMode: v }),
  setFilterPriority: (p) => set({ filterPriority: p, page: 1 }),
  setFilterSearch:   (s) => set({ filterSearch: s, page: 1 }),
  setMine:           (m) => set({ mine: m, page: 1 }),
  setPage:           (p) => set({ page: p }),
  openDetail:        (id)=> set({ detailId: id }),
  closeDetail:       ()  => set({ detailId: null }),
  openCreate:        ()  => set({ createModalOpen: true, editingId: null }),
  openEdit:          (id)=> set({ createModalOpen: false, editingId: id }),
  closeCreateEdit:   ()  => set({ createModalOpen: false, editingId: null }),
}));

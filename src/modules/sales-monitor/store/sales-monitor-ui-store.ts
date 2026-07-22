import { create } from "zustand";

type ActiveTab = "all" | "local" | "export";

interface SalesMonitorUIState {
  activeTab:    ActiveTab;
  filterStatus: string;
  filterSearch: string;
  page:         number;
  modalOpen:    boolean;
  editingId:    string | null;
  confirmDeleteId: string | null;
  setActiveTab:    (tab: ActiveTab) => void;
  setFilterStatus: (s: string)      => void;
  setFilterSearch: (s: string)      => void;
  setPage:         (p: number)      => void;
  openCreate:      ()               => void;
  openEdit:        (id: string)     => void;
  closeModal:      ()               => void;
  setConfirmDelete:(id: string | null) => void;
}

export const useSalesMonitorUIStore = create<SalesMonitorUIState>((set) => ({
  activeTab:       "all",
  filterStatus:    "all",
  filterSearch:    "",
  page:            1,
  modalOpen:       false,
  editingId:       null,
  confirmDeleteId: null,

  setActiveTab:    (tab) => set({ activeTab: tab, page: 1 }),
  setFilterStatus: (s)   => set({ filterStatus: s, page: 1 }),
  setFilterSearch: (s)   => set({ filterSearch: s, page: 1 }),
  setPage:         (p)   => set({ page: p }),
  openCreate:      ()    => set({ modalOpen: true, editingId: null }),
  openEdit:        (id)  => set({ modalOpen: true, editingId: id }),
  closeModal:      ()    => set({ modalOpen: false, editingId: null }),
  setConfirmDelete:(id)  => set({ confirmDeleteId: id }),
}));

import { create } from "zustand";

type ActiveTab = "sources" | "alerts" | "performance";
type ViewMode  = "table" | "card";

interface SourcesUIState {
  activeTab:       ActiveTab;
  viewMode:        ViewMode;
  filterSearch:    string;
  filterRegion:    string;
  page:            number;
  modalOpen:       boolean;
  editingId:       string | null;
  confirmDeleteId: string | null;

  setActiveTab:    (t: ActiveTab) => void;
  setViewMode:     (v: ViewMode)  => void;
  setFilterSearch: (s: string)    => void;
  setFilterRegion: (r: string)    => void;
  setPage:         (p: number)    => void;
  openCreate:      ()             => void;
  openEdit:        (id: string)   => void;
  closeModal:      ()             => void;
  setConfirmDelete:(id: string | null) => void;
}

export const useSourcesUIStore = create<SourcesUIState>((set) => ({
  activeTab:       "sources",
  viewMode:        "table",
  filterSearch:    "",
  filterRegion:    "",
  page:            1,
  modalOpen:       false,
  editingId:       null,
  confirmDeleteId: null,

  setActiveTab:    (t) => set({ activeTab: t }),
  setViewMode:     (v) => set({ viewMode: v }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setFilterRegion: (r) => set({ filterRegion: r, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openCreate:      ()  => set({ modalOpen: true,  editingId: null }),
  openEdit:        (id)=> set({ modalOpen: true,  editingId: id }),
  closeModal:      ()  => set({ modalOpen: false, editingId: null }),
  setConfirmDelete:(id)=> set({ confirmDeleteId: id }),
}));

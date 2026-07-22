import { create } from "zustand";

type ActiveTab = "all" | "buyer" | "supplier" | "vendor" | "surveyor" | "freight";

interface DirectoryUIState {
  activeTab:       ActiveTab;
  filterSearch:    string;
  page:            number;
  detailId:        string | null;
  modalOpen:       boolean;
  editingId:       string | null;
  confirmDeleteId: string | null;

  setActiveTab:    (t: ActiveTab)          => void;
  setFilterSearch: (s: string)             => void;
  setPage:         (p: number)             => void;
  openDetail:      (id: string)            => void;
  closeDetail:     ()                      => void;
  openCreate:      ()                      => void;
  openEdit:        (id: string)            => void;
  closeModal:      ()                      => void;
  setConfirmDelete:(id: string | null)     => void;
}

export const useDirectoryUIStore = create<DirectoryUIState>((set) => ({
  activeTab:       "all",
  filterSearch:    "",
  page:            1,
  detailId:        null,
  modalOpen:       false,
  editingId:       null,
  confirmDeleteId: null,

  setActiveTab:    (t) => set({ activeTab: t, page: 1 }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openDetail:      (id)=> set({ detailId: id }),
  closeDetail:     ()  => set({ detailId: null }),
  openCreate:      ()  => set({ modalOpen: true,  editingId: null }),
  openEdit:        (id)=> set({ modalOpen: true,  editingId: id }),
  closeModal:      ()  => set({ modalOpen: false, editingId: null }),
  setConfirmDelete:(id)=> set({ confirmDeleteId: id }),
}));

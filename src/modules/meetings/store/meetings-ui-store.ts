import { create } from "zustand";

interface MeetingsUIState {
  filterStatus: string;
  filterSearch: string;
  page:         number;
  detailId:     string | null;
  createModalOpen: boolean;
  editingId:    string | null;
  confirmDeleteId: string | null;

  setFilterStatus: (s: string) => void;
  setFilterSearch: (s: string) => void;
  setPage:         (p: number) => void;
  openDetail:      (id: string) => void;
  closeDetail:     () => void;
  openCreate:      () => void;
  openEdit:        (id: string) => void;
  closeCreateEdit: () => void;
  setConfirmDelete:(id: string | null) => void;
}

export const useMeetingsUIStore = create<MeetingsUIState>((set) => ({
  filterStatus:    "all",
  filterSearch:    "",
  page:            1,
  detailId:        null,
  createModalOpen: false,
  editingId:       null,
  confirmDeleteId: null,

  setFilterStatus: (s) => set({ filterStatus: s, page: 1 }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openDetail:      (id)=> set({ detailId: id }),
  closeDetail:     ()  => set({ detailId: null }),
  openCreate:      ()  => set({ createModalOpen: true, editingId: null }),
  openEdit:        (id)=> set({ createModalOpen: false, editingId: id }),
  closeCreateEdit: ()  => set({ createModalOpen: false, editingId: null }),
  setConfirmDelete:(id)=> set({ confirmDeleteId: id }),
}));

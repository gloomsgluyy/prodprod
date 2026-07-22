import { create } from "zustand";

interface PaymentUIState {
  activeTab:       string;
  filterSearch:    string;
  page:            number;
  modalOpen:       boolean;
  editingId:       string | null;
  confirmDeleteId: string | null;

  setActiveTab:    (t: string) => void;
  setFilterSearch: (s: string) => void;
  setPage:         (p: number) => void;
  openCreate:      ()          => void;
  openEdit:        (id: string)=> void;
  closeModal:      ()          => void;
  setConfirmDelete:(id: string | null) => void;
}

export const usePaymentUIStore = create<PaymentUIState>((set) => ({
  activeTab:       "all",
  filterSearch:    "",
  page:            1,
  modalOpen:       false,
  editingId:       null,
  confirmDeleteId: null,

  setActiveTab:    (t) => set({ activeTab: t, page: 1 }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openCreate:      ()  => set({ modalOpen: true,  editingId: null }),
  openEdit:        (id)=> set({ modalOpen: true,  editingId: id }),
  closeModal:      ()  => set({ modalOpen: false, editingId: null }),
  setConfirmDelete:(id)=> set({ confirmDeleteId: id }),
}));

import { create } from "zustand";

interface ExpensesUIState {
  filterStatus:    string;
  filterSearch:    string;
  shipmentOnly:    boolean;
  page:            number;
  modalOpen:       boolean;
  editingId:       string | null;
  previewImageUrl: string | null;
  approveId:       string | null;
  confirmDeleteId: string | null;

  setFilterStatus:    (s: string)          => void;
  setFilterSearch:    (s: string)          => void;
  setShipmentOnly:    (b: boolean)         => void;
  setPage:            (p: number)          => void;
  openCreate:         ()                   => void;
  openEdit:           (id: string)         => void;
  closeModal:         ()                   => void;
  openImagePreview:   (url: string)        => void;
  closeImagePreview:  ()                   => void;
  openApprove:        (id: string)         => void;
  closeApprove:       ()                   => void;
  setConfirmDelete:   (id: string | null)  => void;
}

export const useExpensesUIStore = create<ExpensesUIState>((set) => ({
  filterStatus:    "all",
  filterSearch:    "",
  shipmentOnly:    false,
  page:            1,
  modalOpen:       false,
  editingId:       null,
  previewImageUrl: null,
  approveId:       null,
  confirmDeleteId: null,

  setFilterStatus:    (s) => set({ filterStatus: s, page: 1 }),
  setFilterSearch:    (s) => set({ filterSearch: s, page: 1 }),
  setShipmentOnly:    (b) => set({ shipmentOnly: b, page: 1 }),
  setPage:            (p) => set({ page: p }),
  openCreate:         ()  => set({ modalOpen: true,  editingId: null }),
  openEdit:           (id)=> set({ modalOpen: true,  editingId: id }),
  closeModal:         ()  => set({ modalOpen: false, editingId: null }),
  openImagePreview:   (url)=> set({ previewImageUrl: url }),
  closeImagePreview:  ()  => set({ previewImageUrl: null }),
  openApprove:        (id)=> set({ approveId: id }),
  closeApprove:       ()  => set({ approveId: null }),
  setConfirmDelete:   (id)=> set({ confirmDeleteId: id }),
}));

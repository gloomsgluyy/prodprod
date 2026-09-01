import { create } from "zustand";

type ActiveTab = "all" | "export" | "local";

interface ForecastUIState {
  activeTab:       ActiveTab;
  filterStatus:    string;
  filterSearch:    string;
  filterEntity:    string;
  page:            number;
  detailId:        string | null;
  createModalOpen: boolean;
  editingId:       string | null;
  approveModalId:  string | null;
  convertModalId:  string | null;
  failedModalId:   string | null;
  confirmDeleteId: string | null;

  setActiveTab:       (t: ActiveTab)       => void;
  setFilterStatus:    (s: string)          => void;
  setFilterSearch:    (s: string)          => void;
  setFilterEntity:    (s: string)          => void;
  setPage:            (p: number)          => void;
  openDetail:         (id: string)         => void;
  closeDetail:        ()                   => void;
  openCreate:         ()                   => void;
  openEdit:           (id: string)         => void;
  closeCreateEdit:    ()                   => void;
  openApprove:        (id: string)         => void;
  closeApprove:       ()                   => void;
  openConvert:        (id: string)         => void;
  closeConvert:       ()                   => void;
  openFailed:         (id: string)         => void;
  closeFailed:        ()                   => void;
  setConfirmDelete:   (id: string | null)  => void;
}

export const useForecastUIStore = create<ForecastUIState>((set) => ({
  activeTab:       "all",
  filterStatus:    "all",
  filterSearch:    "",
  filterEntity:    "all",
  page:            1,
  detailId:        null,
  createModalOpen: false,
  editingId:       null,
  approveModalId:  null,
  convertModalId:  null,
  failedModalId:   null,
  confirmDeleteId: null,

  setActiveTab:    (t) => set({ activeTab: t, page: 1 }),
  setFilterStatus: (s) => set({ filterStatus: s, page: 1 }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setFilterEntity: (s) => set({ filterEntity: s, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openDetail:      (id) => set({ detailId: id }),
  closeDetail:     ()   => set({ detailId: null }),
  openCreate:      ()   => set({ createModalOpen: true, editingId: null }),
  openEdit:        (id) => set({ createModalOpen: false, editingId: id }),
  closeCreateEdit: ()   => set({ createModalOpen: false, editingId: null }),
  openApprove:     (id) => set({ approveModalId: id }),
  closeApprove:    ()   => set({ approveModalId: null }),
  openConvert:     (id) => set({ convertModalId: id }),
  closeConvert:    ()   => set({ convertModalId: null }),
  openFailed:      (id) => set({ failedModalId: id }),
  closeFailed:     ()   => set({ failedModalId: null }),
  setConfirmDelete:(id) => set({ confirmDeleteId: id }),
}));

import { create } from "zustand";

type StatusTab = "all" | "upcoming" | "loading" | "in_transit" | "completed" | "cancelled" | "daily_delivery";
type DetailTab = "info" | "documents" | "source_barge" | "timeline" | "issues" | "domestic" | "financial" | "si" | "commercial_ref" | "daily_delivery";

interface ShipmentUIState {
  // List filters
  activeTab:    StatusTab;
  filterSearch: string;
  filterRegion: string;
  filterYear:   string;
  page:         number;
  pageSize:     number;
  // Detail drawer
  detailId:     string | null;
  detailTab:    DetailTab;
  // Modals
  createModalOpen:   boolean;
  editingId:         string | null;
  closeModalId:      string | null;
  issueFormOpen:     boolean;
  sourceChangeOpen:  boolean;
  bargeChangeOpen:   boolean;
  siFormOpen:        boolean;
  timelineType:      "pol" | "pod" | null;

  // Actions
  setActiveTab:      (t: StatusTab)   => void;
  setFilterSearch:   (s: string)      => void;
  setFilterRegion:   (r: string)      => void;
  setFilterYear:     (y: string)      => void;
  setPage:           (p: number)      => void;
  setPageSize:       (s: number)      => void;
  openDetail:        (id: string, tab?: DetailTab) => void;
  closeDetail:       ()               => void;
  setDetailTab:      (t: DetailTab)   => void;
  openCreate:        ()               => void;
  openEdit:          (id: string)     => void;
  closeCreateEdit:   ()               => void;
  openCloseModal:    (id: string)     => void;
  closeCloseModal:   ()               => void;
  toggleIssueForm:   ()               => void;
  toggleSourceChange:()               => void;
  toggleBargeChange: ()               => void;
  toggleSIForm:      ()               => void;
  openTimeline:      (t: "pol"|"pod") => void;
  closeTimeline:     ()               => void;
}

export const useShipmentUIStore = create<ShipmentUIState>((set) => ({
  activeTab:       "all",
  filterSearch:    "",
  filterRegion:    "",
  filterYear:      "",
  page:            1,
  pageSize:        25,
  detailId:        null,
  detailTab:       "info",
  createModalOpen: false,
  editingId:       null,
  closeModalId:    null,
  issueFormOpen:   false,
  sourceChangeOpen:false,
  bargeChangeOpen: false,
  siFormOpen:      false,
  timelineType:    null,

  setActiveTab:      (t) => set({ activeTab: t, page: 1 }),
  setFilterSearch:   (s) => set({ filterSearch: s, page: 1 }),
  setFilterRegion:   (r) => set({ filterRegion: r, page: 1 }),
  setFilterYear:     (y) => set({ filterYear: y, page: 1 }),
  setPage:           (p) => set({ page: p }),
  setPageSize:       (s) => set({ pageSize: s, page: 1 }),
  openDetail:        (id, tab = "info") => set({ detailId: id, detailTab: tab }),
  closeDetail:       ()  => set({ detailId: null }),
  setDetailTab:      (t) => set({ detailTab: t }),
  openCreate:        ()  => set({ createModalOpen: true, editingId: null }),
  openEdit:          (id)=> set({ createModalOpen: false, editingId: id }),
  closeCreateEdit:   ()  => set({ createModalOpen: false, editingId: null }),
  openCloseModal:    (id)=> set({ closeModalId: id }),
  closeCloseModal:   ()  => set({ closeModalId: null }),
  toggleIssueForm:   ()  => set((s) => ({ issueFormOpen: !s.issueFormOpen })),
  toggleSourceChange:()  => set((s) => ({ sourceChangeOpen: !s.sourceChangeOpen })),
  toggleBargeChange: ()  => set((s) => ({ bargeChangeOpen: !s.bargeChangeOpen })),
  toggleSIForm:      ()  => set((s) => ({ siFormOpen: !s.siFormOpen })),
  openTimeline:      (t) => set({ timelineType: t }),
  closeTimeline:     ()  => set({ timelineType: null }),
}));

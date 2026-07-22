import { create } from "zustand";

type ViewMode = "card" | "list";

interface TransshipmentUIState {
  activeTab:    "active" | "completed" | "all";
  viewMode:     ViewMode;
  filterSearch: string;
  page:         number;
  modalOpen:    boolean;
  editingId:    string | null;
  milestoneId:  string | null;
  riskId:       string | null;

  setActiveTab:    (t: "active"|"completed"|"all") => void;
  setViewMode:     (v: ViewMode)    => void;
  setFilterSearch: (s: string)      => void;
  setPage:         (p: number)      => void;
  openCreate:      ()               => void;
  openEdit:        (id: string)     => void;
  closeModal:      ()               => void;
  openMilestones:  (id: string)     => void;
  closeMilestones: ()               => void;
  openRisk:        (id: string)     => void;
  closeRisk:       ()               => void;
}

export const useTransshipmentUIStore = create<TransshipmentUIState>((set) => ({
  activeTab:    "active",
  viewMode:     "card",
  filterSearch: "",
  page:         1,
  modalOpen:    false,
  editingId:    null,
  milestoneId:  null,
  riskId:       null,

  setActiveTab:    (t) => set({ activeTab: t, page: 1 }),
  setViewMode:     (v) => set({ viewMode: v }),
  setFilterSearch: (s) => set({ filterSearch: s, page: 1 }),
  setPage:         (p) => set({ page: p }),
  openCreate:      ()  => set({ modalOpen: true,  editingId: null }),
  openEdit:        (id)=> set({ modalOpen: true,  editingId: id }),
  closeModal:      ()  => set({ modalOpen: false, editingId: null }),
  openMilestones:  (id)=> set({ milestoneId: id }),
  closeMilestones: ()  => set({ milestoneId: null }),
  openRisk:        (id)=> set({ riskId: id }),
  closeRisk:       ()  => set({ riskId: null }),
}));

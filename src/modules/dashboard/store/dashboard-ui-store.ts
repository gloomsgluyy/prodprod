import { create } from "zustand";

interface DashboardFilters {
  search: string;
  status: string;
  marketType: string;
  country: string;
  timeRange: string;
  customStart: string;
  customEnd: string;
}

interface DashboardUIState {
  filters: DashboardFilters;
  volumeYear: number;
  volumeSegment: string;
  chartYear: number;
  volumeExpanded: boolean;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  setVolumeYear: (year: number) => void;
  setVolumeSegment: (segment: string) => void;
  setChartYear: (year: number) => void;
  toggleVolumeExpanded: () => void;
}

export const useDashboardUIStore = create<DashboardUIState>((set) => ({
  filters: {
    search: "",
    status: "all",
    marketType: "all",
    country: "all",
    timeRange: "last_30",
    customStart: "",
    customEnd: "",
  },
  volumeYear: new Date().getFullYear(),
  volumeSegment: "total",
  chartYear: new Date().getFullYear(),
  volumeExpanded: false,

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setVolumeYear: (year) => set({ volumeYear: year }),
  setVolumeSegment: (segment) => set({ volumeSegment: segment }),
  setChartYear: (year) => set({ chartYear: year }),
  toggleVolumeExpanded: () => set((s) => ({ volumeExpanded: !s.volumeExpanded })),
}));

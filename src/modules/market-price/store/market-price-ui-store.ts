import { create } from "zustand";

interface MarketPriceUIState {
  chartRange: "2w" | "4w" | "all";
  listPage: number;
  showInputForm: boolean;
  showScrapingModal: boolean;
  calcBaseIndex: string;
  calcAdjustment: number;
  hpbGar: number;
  hpbTm: number;
  hpbTs: number;
  hpbAsh: number;
  setChartRange: (r: "2w" | "4w" | "all") => void;
  setListPage: (p: number) => void;
  toggleInputForm: () => void;
  toggleScrapingModal: () => void;
  setCalcBaseIndex: (idx: string) => void;
  setCalcAdjustment: (n: number) => void;
  setHpb: (field: "hpbGar"|"hpbTm"|"hpbTs"|"hpbAsh", val: number) => void;
}

export const useMarketPriceUIStore = create<MarketPriceUIState>((set) => ({
  chartRange: "4w",
  listPage: 1,
  showInputForm: false,
  showScrapingModal: false,
  calcBaseIndex: "ici3",
  calcAdjustment: 0,
  hpbGar: 4200,
  hpbTm: 35,
  hpbTs: 0.2,
  hpbAsh: 8,

  setChartRange: (r) => set({ chartRange: r }),
  setListPage: (p) => set({ listPage: p }),
  toggleInputForm: () => set((s) => ({ showInputForm: !s.showInputForm })),
  toggleScrapingModal: () => set((s) => ({ showScrapingModal: !s.showScrapingModal })),
  setCalcBaseIndex: (idx) => set({ calcBaseIndex: idx }),
  setCalcAdjustment: (n) => set({ calcAdjustment: n }),
  setHpb: (field, val) => set({ [field]: val }),
}));

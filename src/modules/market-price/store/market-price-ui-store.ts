import { create } from "zustand";

interface MarketPriceUIState {
  chartRange: "2w" | "4w" | "all";
  listPage: number;
  showInputForm: boolean;
  showScrapingModal: boolean;
  calcBaseIndex: string;
  calcDatePreset: "latest" | "1w" | "2w" | "custom";
  calcCustomDate: string;
  calcAdjustment: number;
  calcDescription: string;
  calcActualTs: number;
  calcContractTs: number;
  calcActualAsh: number;
  calcContractAsh: number;
  hpbGar: number;
  hpbTm: number;
  hpbTs: number;
  hpbAsh: number;
  setChartRange: (r: "2w" | "4w" | "all") => void;
  setListPage: (p: number) => void;
  toggleInputForm: () => void;
  toggleScrapingModal: () => void;
  setCalcBaseIndex: (idx: string) => void;
  setCalcDatePreset: (preset: "latest" | "1w" | "2w" | "custom") => void;
  setCalcCustomDate: (date: string) => void;
  setCalcAdjustment: (n: number) => void;
  setCalcDescription: (description: string) => void;
  setCalcQuality: (field: "calcActualTs" | "calcContractTs" | "calcActualAsh" | "calcContractAsh", value: number) => void;
  setHpb: (field: "hpbGar"|"hpbTm"|"hpbTs"|"hpbAsh", val: number) => void;
}

export const useMarketPriceUIStore = create<MarketPriceUIState>((set) => ({
  chartRange: "4w",
  listPage: 1,
  showInputForm: false,
  showScrapingModal: false,
  calcBaseIndex: "ici3",
  calcDatePreset: "latest",
  calcCustomDate: "",
  calcAdjustment: 0,
  calcDescription: "",
  calcActualTs: 0.2,
  calcContractTs: 0.5,
  calcActualAsh: 8,
  calcContractAsh: 7,
  hpbGar: 4200,
  hpbTm: 35,
  hpbTs: 0.2,
  hpbAsh: 8,

  setChartRange: (r) => set({ chartRange: r }),
  setListPage: (p) => set({ listPage: p }),
  toggleInputForm: () => set((s) => ({ showInputForm: !s.showInputForm })),
  toggleScrapingModal: () => set((s) => ({ showScrapingModal: !s.showScrapingModal })),
  setCalcBaseIndex: (idx) => set({ calcBaseIndex: idx }),
  setCalcDatePreset: (preset) => set({ calcDatePreset: preset }),
  setCalcCustomDate: (date) => set({ calcCustomDate: date }),
  setCalcAdjustment: (n) => set({ calcAdjustment: n }),
  setCalcDescription: (description) => set({ calcDescription: description }),
  setCalcQuality: (field, value) => set({ [field]: value }),
  setHpb: (field, val) => set({ [field]: val }),
}));

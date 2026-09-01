import { create } from "zustand";

export const CALCULATOR_INDEX_OPTIONS = [
  { key: "ici1", label: "ICI 1 (6500)" }, { key: "ici2", label: "ICI 2 (5800)" },
  { key: "ici3", label: "ICI 3 (5000)" }, { key: "ici4", label: "ICI 4 (4200)" },
  { key: "ici5", label: "ICI 5 (3400)" }, { key: "newcastle", label: "Newcastle" },
  { key: "hba", label: "HBA" }, { key: "hba1", label: "HBA I (5300)" },
  { key: "hba2", label: "HBA II (4100)" }, { key: "hba3", label: "HBA III (3400)" },
] as const;

export type CalculatorIndexKey = typeof CALCULATOR_INDEX_OPTIONS[number]["key"];
export type ProrataMethod = "simple" | "weighted";

export interface BaseIndexSelection {
  key: CalculatorIndexKey;
  label: string;
  weight: number;
}

export interface CalculationResult {
  compositePrice: number | null;
  baseGar: number;
  targetGar: number | null;
  priceAfterProrata: number | null;
  basisAdjustment: number;
  priceAfterBasis: number | null;
  tsAdjustment: number;
  ashAdjustment: number;
  qualityAdjustment: number;
  finalPrice: number | null;
}

export interface CalculationSnapshotEntry {
  value: number | null;
  date: string | null;
  source?: string;
}

interface MarketPriceUIState {
  chartRange: "2w" | "4w" | "all";
  listPage: number;
  showInputForm: boolean;
  showScrapingModal: boolean;
  calcDatePreset: "latest" | "1w" | "2w" | "custom";
  calcCustomDate: string;
  baseIndexes: BaseIndexSelection[];
  prorataMethod: ProrataMethod;
  baseGar: number;
  targetGar: number | null;
  targetProrataMethod: string;
  basis: string;
  basisAdjustment: number;
  basisDescription: string;
  calcActualTs: number;
  calcContractTs: number;
  calcActualAsh: number;
  calcContractAsh: number;
  calcAdjustment: number;
  calcDescription: string;
  hpbGar: number;
  hpbTm: number;
  hpbTs: number;
  hpbAsh: number;
  setChartRange: (range: "2w" | "4w" | "all") => void;
  setListPage: (page: number) => void;
  toggleInputForm: () => void;
  toggleScrapingModal: () => void;
  setCalcDatePreset: (preset: "latest" | "1w" | "2w" | "custom") => void;
  setCalcCustomDate: (date: string) => void;
  addBaseIndex: (key: CalculatorIndexKey) => void;
  removeBaseIndex: (key: CalculatorIndexKey) => void;
  setBaseIndexWeight: (key: CalculatorIndexKey, weight: number) => void;
  setProrataMethod: (method: ProrataMethod) => void;
  setBaseGar: (value: number) => void;
  setTargetGar: (value: number | null) => void;
  setTargetProrataMethod: (method: string) => void;
  setBasis: (basis: string, adjustment: number, description?: string) => void;
  setCalcQuality: (field: "calcActualTs" | "calcContractTs" | "calcActualAsh" | "calcContractAsh", value: number) => void;
  setCalcAdjustment: (value: number) => void;
  setCalcDescription: (description: string) => void;
  setHpb: (field: "hpbGar" | "hpbTm" | "hpbTs" | "hpbAsh", value: number) => void;
  getCalculationResult: (prices: Record<string, number | null>) => CalculationResult;
  buildSavePayload: (snapshot: Record<string, CalculationSnapshotEntry>) => Record<string, unknown>;
}

const initialIndexes: BaseIndexSelection[] = [{ key: "ici3", label: "ICI 3 (5000)", weight: 100 }];

export const useMarketPriceUIStore = create<MarketPriceUIState>((set, get) => ({
  chartRange: "4w", listPage: 1, showInputForm: false, showScrapingModal: false,
  calcDatePreset: "latest", calcCustomDate: "", baseIndexes: initialIndexes,
  prorataMethod: "weighted", baseGar: 5000, targetGar: null, targetProrataMethod: "linear",
  basis: "fob_barge", basisAdjustment: 0, basisDescription: "FOB Barge",
  calcActualTs: 0.2, calcContractTs: 0.5, calcActualAsh: 8, calcContractAsh: 7,
  calcAdjustment: 0, calcDescription: "", hpbGar: 4200, hpbTm: 35, hpbTs: 0.2, hpbAsh: 8,
  setChartRange: (chartRange) => set({ chartRange }), setListPage: (listPage) => set({ listPage }),
  toggleInputForm: () => set((state) => ({ showInputForm: !state.showInputForm })),
  toggleScrapingModal: () => set((state) => ({ showScrapingModal: !state.showScrapingModal })),
  setCalcDatePreset: (calcDatePreset) => set({ calcDatePreset }), setCalcCustomDate: (calcCustomDate) => set({ calcCustomDate }),
  addBaseIndex: (key) => set((state) => state.baseIndexes.some((item) => item.key === key) ? state : { baseIndexes: [...state.baseIndexes, { key, label: CALCULATOR_INDEX_OPTIONS.find((item) => item.key === key)?.label ?? key, weight: 0 }] }),
  removeBaseIndex: (key) => set((state) => state.baseIndexes.length <= 1 ? state : { baseIndexes: state.baseIndexes.filter((item) => item.key !== key) }),
  setBaseIndexWeight: (key, weight) => set((state) => ({ baseIndexes: state.baseIndexes.map((item) => item.key === key ? { ...item, weight } : item) })),
  setProrataMethod: (prorataMethod) => set({ prorataMethod }), setBaseGar: (baseGar) => set({ baseGar }),
  setTargetGar: (targetGar) => set({ targetGar }), setTargetProrataMethod: (targetProrataMethod) => set({ targetProrataMethod }),
  setBasis: (basis, basisAdjustment, basisDescription = basis) => set({ basis, basisAdjustment, basisDescription }),
  setCalcQuality: (field, value) => set({ [field]: value }), setCalcAdjustment: (calcAdjustment) => set({ calcAdjustment }),
  setCalcDescription: (calcDescription) => set({ calcDescription }), setHpb: (field, value) => set({ [field]: value }),
  getCalculationResult: (prices) => {
    const state = get();
    const totalWeight = state.baseIndexes.reduce((sum, item) => sum + item.weight, 0);
    const valid = state.baseIndexes.map((item) => ({ ...item, price: prices[item.key] ?? null })).filter((item) => item.price != null);
    const compositePrice = valid.length === 0 || (state.prorataMethod === "weighted" && Math.abs(totalWeight - 100) > 0.0001)
      ? null
      : state.prorataMethod === "simple"
        ? valid.reduce((sum, item) => sum + Number(item.price), 0) / valid.length
        : valid.reduce((sum, item) => sum + Number(item.price) * item.weight / 100, 0);
    const priceAfterProrata = compositePrice == null ? null : state.targetGar == null || state.baseGar <= 0 ? compositePrice : compositePrice * state.targetGar / state.baseGar;
    const priceAfterBasis = priceAfterProrata == null ? null : priceAfterProrata + state.basisAdjustment;
    const tsAdjustment = state.calcContractTs - state.calcActualTs;
    const ashAdjustment = state.calcContractAsh - state.calcActualAsh;
    const qualityAdjustment = tsAdjustment + ashAdjustment;
    return { compositePrice, baseGar: state.baseGar, targetGar: state.targetGar, priceAfterProrata, basisAdjustment: state.basisAdjustment, priceAfterBasis, tsAdjustment, ashAdjustment, qualityAdjustment, finalPrice: priceAfterBasis == null ? null : priceAfterBasis + qualityAdjustment + state.calcAdjustment };
  },
  buildSavePayload: (snapshot) => {
    const state = get();
    const prices = Object.fromEntries(Object.entries(snapshot).map(([key, entry]) => [key, entry.value]));
    const result = state.getCalculationResult(prices);
    const primary = state.baseIndexes[0];
    const primarySnapshot = snapshot[primary.key];
    if (result.compositePrice == null || result.finalPrice == null || !primarySnapshot?.date) throw new Error("Complete the index selection and ensure weights total 100% before saving.");
    const baseIndexes = state.baseIndexes.map((item) => ({ ...item, price: prices[item.key] ?? null, date: snapshot[item.key]?.date ?? null }));
    return {
      calculationType: "standard_index", baseIndex: primary.key, baseIndexDate: primarySnapshot.date.slice(0, 10), baseIndexValue: Number(prices[primary.key]),
      baseIndexes, baseIndexWeights: Object.fromEntries(state.baseIndexes.map((item) => [item.key, item.weight])), marketPriceSnapshot: snapshot,
      prorataMethod: state.prorataMethod, baseGar: result.baseGar, targetGar: result.targetGar, targetProrataMethod: state.targetProrataMethod,
      priceAfterProrata: result.priceAfterProrata, basis: state.basis, basisAdjustment: result.basisAdjustment, basisDescription: state.basisDescription,
      priceAfterBasis: result.priceAfterBasis, actualTs: state.calcActualTs, contractTs: state.calcContractTs, tsAdjustment: result.tsAdjustment,
      actualAsh: state.calcActualAsh, contractAsh: state.calcContractAsh, ashAdjustment: result.ashAdjustment, qualityAdjustment: result.qualityAdjustment,
      premiumDiscount: state.calcAdjustment, description: state.calcDescription || null, finalPrice: result.finalPrice,
    };
  },
}));

import { create } from "zustand";
import { isExecutive, canEditMarketPrice } from "@/lib/roles";

interface AuthUIState {
  // Derived convenience flags — populated from NextAuth session
  role: string | null;
  isExecutive: boolean;
  canEditMarketPrice: boolean;
  setRole: (role: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthUIState>((set) => ({
  role: null,
  isExecutive: false,
  canEditMarketPrice: false,

  setRole: (role) =>
    set({
      role,
      isExecutive: isExecutive(role),
      canEditMarketPrice: canEditMarketPrice(role),
    }),

  clear: () => set({ role: null, isExecutive: false, canEditMarketPrice: false }),
}));

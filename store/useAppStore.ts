import { create } from "zustand";

interface AppState {
  currency: string;
  theme: "system" | "light" | "dark";
  selectedAccountId: string | null;
  setCurrency: (currency: string) => void;
  setTheme: (theme: "system" | "light" | "dark") => void;
  setSelectedAccountId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currency: "INR",
  theme: "system",
  selectedAccountId: null,
  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
}));


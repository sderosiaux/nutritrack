import { create } from "zustand";

interface UIState {
  selectedDate: string;
  sidebarOpen: boolean;
  setSelectedDate: (date: string) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  sidebarOpen: false,
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

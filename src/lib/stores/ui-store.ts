import { create } from "zustand";

interface UIState {
  selectedDate: string;
  sidebarOpen: boolean;
  logModalOpen: boolean;
  logModalMealType: string;
  setSelectedDate: (date: string) => void;
  toggleSidebar: () => void;
  openLogModal: (mealType?: string) => void;
  closeLogModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  sidebarOpen: true,
  logModalOpen: false,
  logModalMealType: "breakfast",
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openLogModal: (mealType = "breakfast") => set({ logModalOpen: true, logModalMealType: mealType }),
  closeLogModal: () => set({ logModalOpen: false }),
}));

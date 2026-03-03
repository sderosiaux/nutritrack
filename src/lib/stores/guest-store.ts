import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface GuestState {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      setIsGuest: (value) => set({ isGuest: value }),
    }),
    {
      name: "nutritrack-guest",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      partialize: (s) => ({ isGuest: s.isGuest }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesStore {
  neverUse: string[];
  alwaysHave: string[];
  addNeverUse: (item: string) => void;
  removeNeverUse: (item: string) => void;
  addAlwaysHave: (item: string) => void;
  removeAlwaysHave: (item: string) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      neverUse: [],
      alwaysHave: [],

      addNeverUse: (item) =>
        set((s) => ({ neverUse: s.neverUse.includes(item) ? s.neverUse : [...s.neverUse, item] })),
      removeNeverUse: (item) =>
        set((s) => ({ neverUse: s.neverUse.filter((i) => i !== item) })),

      addAlwaysHave: (item) =>
        set((s) => ({ alwaysHave: s.alwaysHave.includes(item) ? s.alwaysHave : [...s.alwaysHave, item] })),
      removeAlwaysHave: (item) =>
        set((s) => ({ alwaysHave: s.alwaysHave.filter((i) => i !== item) })),
    }),
    {
      name: 'market-app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

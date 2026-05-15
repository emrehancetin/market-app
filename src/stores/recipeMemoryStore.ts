import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeIngredient } from '../types';

interface RecipeMemory {
  customIngredients: RecipeIngredient[];
  removedIngredients: string[];
}

interface RecipeMemoryStore {
  memories: Record<string, RecipeMemory>;
  saveMemory: (meal: string, customs: RecipeIngredient[], removed: string[]) => void;
  getMemory: (meal: string) => RecipeMemory | null;
}

const normalize = (meal: string) => meal.toLowerCase().trim();

export const useRecipeMemoryStore = create<RecipeMemoryStore>()(
  persist(
    (set, get) => ({
      memories: {},

      saveMemory: (meal, customs, removed) =>
        set((s) => ({
          memories: {
            ...s.memories,
            [normalize(meal)]: { customIngredients: customs, removedIngredients: removed },
          },
        })),

      getMemory: (meal) => get().memories[normalize(meal)] ?? null,
    }),
    {
      name: 'market-app-recipe-memory',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

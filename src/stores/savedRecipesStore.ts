import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeIngredient } from '../types';

export interface SavedRecipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
}

interface SavedRecipesStore {
  recipes: SavedRecipe[];
  saveRecipe: (name: string, ingredients: RecipeIngredient[]) => void;
  deleteRecipe: (id: string) => void;
  findRecipe: (name: string) => SavedRecipe | null;
}

export const useSavedRecipesStore = create<SavedRecipesStore>()(
  persist(
    (set, get) => ({
      recipes: [],

      saveRecipe: (name, ingredients) =>
        set((s) => {
          const existing = s.recipes.find((r) => r.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            return { recipes: s.recipes.map((r) => r.id === existing.id ? { ...r, ingredients } : r) };
          }
          return {
            recipes: [
              { id: Date.now().toString(), name, ingredients, createdAt: new Date().toISOString() },
              ...s.recipes,
            ],
          };
        }),

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      findRecipe: (name) => {
        const n = name.toLowerCase().trim();
        return get().recipes.find((r) => r.name.toLowerCase().includes(n) || n.includes(r.name.toLowerCase())) ?? null;
      },
    }),
    {
      name: 'market-app-saved-recipes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

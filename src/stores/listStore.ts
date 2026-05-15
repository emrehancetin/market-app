import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListItem, ShoppingList, ProductInfo } from '../types';

interface ListStore {
  currentList: ShoppingList;
  savedLists: ShoppingList[];
  addItem: (item: Omit<ListItem, 'id' | 'checked'>) => void;
  toggleItem: (id: string) => void;
  deleteItem: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  setProductInfo: (id: string, info: ProductInfo) => void;
  saveCurrentList: () => void;
  loadList: (id: string) => void;
  cloneList: (id: string) => void;
  deleteFromHistory: (id: string) => void;
}

const newList = (): ShoppingList => ({
  id: Date.now().toString(),
  name: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' Listesi',
  createdAt: new Date().toISOString(),
  items: [],
});

export const useListStore = create<ListStore>()(
  persist(
    (set) => ({
      currentList: newList(),
      savedLists: [],

      addItem: (item) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: [
              ...state.currentList.items,
              { ...item, id: Date.now().toString(), checked: false },
            ],
          },
        })),

      toggleItem: (id) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: state.currentList.items.map((item) =>
              item.id === id ? { ...item, checked: !item.checked } : item
            ),
          },
        })),

      deleteItem: (id) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: state.currentList.items.filter((item) => item.id !== id),
          },
        })),

      updateNote: (id, note) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: state.currentList.items.map((item) =>
              item.id === id ? { ...item, note } : item
            ),
          },
        })),

      setProductInfo: (id, info) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: state.currentList.items.map((item) =>
              item.id === id ? { ...item, productInfo: info } : item
            ),
          },
        })),

      saveCurrentList: () =>
        set((state) => {
          const already = state.savedLists.find((l) => l.id === state.currentList.id);
          const updated = already
            ? state.savedLists.map((l) => l.id === state.currentList.id ? state.currentList : l)
            : [state.currentList, ...state.savedLists];
          return { savedLists: updated, currentList: newList() };
        }),

      loadList: (id) =>
        set((state) => {
          const list = state.savedLists.find((l) => l.id === id);
          if (!list) return {};
          return { currentList: list, savedLists: state.savedLists.filter((l) => l.id !== id) };
        }),

      cloneList: (id) =>
        set((state) => {
          const list = state.savedLists.find((l) => l.id === id);
          if (!list) return {};
          return {
            currentList: {
              ...list,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              name: list.name + ' (kopya)',
              items: list.items.map((item) => ({ ...item, checked: false, productInfo: undefined })),
            },
          };
        }),

      deleteFromHistory: (id) =>
        set((state) => ({
          savedLists: state.savedLists.filter((l) => l.id !== id),
        })),
    }),
    {
      name: 'market-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

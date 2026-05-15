import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListItem, ShoppingList, ProductInfo } from '../types';
import { supabase } from '../lib/supabase';

interface ListStore {
  currentList: ShoppingList;
  savedLists: ShoppingList[];
  addItem: (item: Omit<ListItem, 'id' | 'checked'> & { id?: string }) => void;
  toggleItem: (id: string) => void;
  deleteItem: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  setProductInfo: (id: string, info: ProductInfo) => void;
  setCategory: (id: string, category: string) => void;
  saveCurrentList: () => void;
  loadList: (id: string) => void;
  cloneList: (id: string) => void;
  deleteFromHistory: (id: string) => void;
  syncFromCloud: () => Promise<void>;
}

const newList = (): ShoppingList => ({
  id: Date.now().toString(),
  name: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' Listesi',
  createdAt: new Date().toISOString(),
  items: [],
});

async function pushListToCloud(list: ShoppingList) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('shopping_lists').upsert({
    id: list.id,
    user_id: user.id,
    name: list.name,
    created_at: list.createdAt,
  });

  if (list.items.length > 0) {
    await supabase.from('list_items').upsert(
      list.items.map((item) => ({
        id: item.id,
        list_id: list.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        category: item.category,
        checked: item.checked,
        product_info: item.productInfo ?? null,
      }))
    );
  }
}

export const useListStore = create<ListStore>()(
  persist(
    (set, get) => ({
      currentList: newList(),
      savedLists: [],

      addItem: (item) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: [
              ...state.currentList.items,
              { ...item, id: item.id ?? Date.now().toString(), checked: false },
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

      setCategory: (id, category) =>
        set((state) => ({
          currentList: {
            ...state.currentList,
            items: state.currentList.items.map((item) =>
              item.id === id ? { ...item, category } : item
            ),
          },
        })),

      saveCurrentList: () => {
        const list = get().currentList;
        set((state) => {
          const already = state.savedLists.find((l) => l.id === list.id);
          const updated = already
            ? state.savedLists.map((l) => l.id === list.id ? list : l)
            : [list, ...state.savedLists];
          return { savedLists: updated, currentList: newList() };
        });
        pushListToCloud(list);
      },

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

      syncFromCloud: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: lists } = await supabase
          .from('shopping_lists')
          .select('*, list_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!lists) return;

        const cloudLists: ShoppingList[] = lists.map((l: any) => ({
          id: l.id,
          name: l.name,
          createdAt: l.created_at,
          items: (l.list_items ?? []).map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            note: i.note,
            category: i.category,
            checked: i.checked,
            productInfo: i.product_info ?? undefined,
          })),
        }));

        set((state) => {
          const localIds = new Set(state.savedLists.map((l) => l.id));
          const newFromCloud = cloudLists.filter((l) => !localIds.has(l.id));
          return { savedLists: [...state.savedLists, ...newFromCloud] };
        });
      },
    }),
    {
      name: 'market-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { ListItem, ShoppingList, ProductInfo } from '../types';

interface ListStore {
  currentList: ShoppingList;
  addItem: (item: Omit<ListItem, 'id' | 'checked'>) => void;
  toggleItem: (id: string) => void;
  deleteItem: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  setProductInfo: (id: string, info: ProductInfo) => void;
}

const defaultList: ShoppingList = {
  id: '1',
  name: 'Bu Haftanın Listesi',
  createdAt: new Date().toISOString(),
  items: [],
};



export const useListStore = create<ListStore>((set) => ({
  currentList: defaultList,

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
}));
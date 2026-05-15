export interface ListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note: string;
  category: string;
  checked: boolean;
  productInfo?: ProductInfo;
}

export interface ProductInfo {
  section: string;
  nearbyProducts: string[];
  tips: string;
  fromCache: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ListItem[];
}
"use client";

import { create } from "zustand";
import { saveOrUpdateCart, getCartItems, getCartTotal, increaseCartItem, decreaseCartItem } from "@/lib/actions/action";
import { getOrCreateCookieId } from "@/lib/cookieId";
import type { CartTotal } from "@/lib/data";
import Cookies from "js-cookie";

export interface ProductType {
  id: string;
  title: string;
  price: number;
  img: string;
  subtitle?: string;
  categoryId?: string;
  deliveryTime?: string;
}

interface CartItem {
  item: ProductType;
  quantity: number;
}

interface CartStore {
  cartItems: CartItem[];
  cookieId: string | null;
  total: CartTotal | null;
  loading: boolean;
  initCookieId: () => void;
  fetchCart: () => Promise<void>;
  fetchTotal: () => Promise<void>;
  addItem: (item: ProductType, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  increaseQuantity: (id: string) => Promise<void>;
  decreaseQuantity: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const useCart = create<CartStore>((set, get) => ({
  cartItems: [],
  cookieId: null,
  total: null,
  loading: false,

  // ✅ Always hydrate cookieId from localStorage on mount, generate if not present
  initCookieId: () => {
    const cookieId = getOrCreateCookieId();
    if (cookieId && get().cookieId !== cookieId) {
      set({ cookieId });
    }
  },

  fetchCart: async () => {
    // Ensure cookieId is initialized
    get().initCookieId();
    let cookieId = get().cookieId;
    if (!cookieId) {
      cookieId = getOrCreateCookieId();
      if (cookieId) set({ cookieId });
    }
    if (!cookieId) return;

    set({ loading: true });
    const data = await getCartItems();

    if (data?.success && data.data && data.data.items) {
      set({
        cartItems: data.data.items.map(i => ({
          item: {
            id: i.productId,
            title: i.productName || i.name || "Product",
            price: i.dp ? parseFloat(i.dp) : (i.price || 0),
            img: i.image || ""
          },
          quantity: i.quantity
        })),
        loading: false
      });
    } else {
      set({ loading: false });
    }
  },

  fetchTotal: async () => {
    const cookieId = get().cookieId || getOrCreateCookieId();
    if (!cookieId) return;

    const totalData = await getCartTotal();
    if (totalData) set({ total: totalData });
  },

  addItem: async (item, quantity = 1) => {
    set({ loading: true });
    const data = await saveOrUpdateCart(item.id, quantity, "insert");

    if (data?.success && data.data) {
      set({
        cartItems: data.data.items.map(i => ({
          item: {
            id: i.productId,
            title: i.productName || i.name || "Product",
            price: i.dp ? parseFloat(i.dp) : (i.price || 0),
            img: i.image || ""
          },
          quantity: i.quantity
        })),
        loading: false
      });
      await get().fetchTotal();
    } else set({ loading: false });
  },

  removeItem: async (id) => {
    set({ loading: true });
    const data = await saveOrUpdateCart(id, 0, "remove");

    if (data?.success && data.data) {
      set({
        cartItems: data.data.items.map(i => ({
          item: {
            id: i.productId,
            title: i.productName || i.name || "Product",
            price: i.dp ? parseFloat(i.dp) : (i.price || 0),
            img: i.image || ""
          },
          quantity: i.quantity
        })),
        loading: false
      });
      await get().fetchTotal();
    } else set({ loading: false });
  },

  increaseQuantity: async (id) => {
    const item = get().cartItems.find(ci => ci.item.id === id);
    if (!item) return;

    const data = await increaseCartItem(item.item.id, 1);

    if (data?.success && data.data) {
      set({
        cartItems: data.data.items.map(i => ({
          item: { 
            id: i.productId, 
            title: i.productName || i.name || "Product", 
            price: i.dp ? parseFloat(i.dp) : (i.price || 0), 
            img: i.image || "" 
          },
          quantity: i.quantity
        }))
      });
      await get().fetchTotal();
    }
  },

  decreaseQuantity: async (id) => {
    const item = get().cartItems.find(ci => ci.item.id === id);
    if (!item) return;

    const data = await decreaseCartItem(item.item.id, 1);

    if (data?.success && data.data) {
      set({
        cartItems: data.data.items.map(i => ({
          item: { 
            id: i.productId, 
            title: i.productName || i.name || "Product", 
            price: i.dp ? parseFloat(i.dp) : (i.price || 0), 
            img: i.image || "" 
          },
          quantity: i.quantity
        }))
      });
      await get().fetchTotal();
    }
  },

  clearCart: async () => {
  const items = get().cartItems.map(ci => ci.item.id);
  for (const id of items) {
    await get().removeItem(id);
  }

  // ✅ Clear cookieId from state and localStorage
  set({ cookieId: null, total: null, cartItems: [] });
  if (typeof window !== "undefined") {
    Cookies.remove("cookieId");
    localStorage.removeItem("cookieId");
  }
},
}));

export default useCart;

import { CartItem, Product } from "@/types/product";
import { useState, useEffect, useCallback } from "react";

const CART_KEY = "huumorikauppa-cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export interface LastAddedItem {
  product: Product;
  size?: string;
  color?: string;
  customText?: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [lastAddedItem, setLastAddedItem] = useState<LastAddedItem | null>(null);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, selectedSize?: string, selectedColor?: string, customText?: string) => {
    const trimmedText = customText?.trim() ? customText.trim().slice(0, 200) : undefined;
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor && (i.customText || undefined) === trimmedText
      );
      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedColor, customText: trimmedText }];
    });
    setLastAddedItem({ product, size: selectedSize, color: selectedColor, customText: trimmedText });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string, selectedColor?: string, customText?: string) => {
    setItems(prev => prev.filter(
      i => !(i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor && (i.customText || undefined) === (customText || undefined))
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, selectedColor?: string, customText?: string) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedColor, customText);
      return;
    }
    setItems(prev => prev.map(i =>
      i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor && (i.customText || undefined) === (customText || undefined)
        ? { ...i, quantity }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);
  const clearLastAdded = useCallback(() => setLastAddedItem(null), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, lastAddedItem, clearLastAdded };
}

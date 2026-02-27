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

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedColor }];
    });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string, selectedColor?: string) => {
    setItems(prev => prev.filter(
      i => !(i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedColor);
      return;
    }
    setItems(prev => prev.map(i =>
      i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor
        ? { ...i, quantity }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice };
}

import { CartItem, GiftCardDetails, Product } from "@/types/product";
import { useState, useEffect, useCallback } from "react";
import { trackAddToCart } from "@/lib/analytics";
import { onPiilotettu } from "@/lib/hiddenCategories";

const CART_KEY = "huumorikauppa-cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    const items: CartItem[] = stored ? JSON.parse(stored) : [];
    // Myynnistä piilotetut tuotteet (mukit 21.10.2026) pois tallennetusta korista.
    return items.filter((i) => !onPiilotettu(i?.product?.category));
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/** Sama koririvi: tuote, koko, väri, oma teksti ja rivitunnus (lahjakortit). */
const samaRivi = (i: CartItem, productId: string, selectedSize?: string, selectedColor?: string, customText?: string, lineId?: string) =>
  i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor &&
  (i.customText || undefined) === (customText || undefined) && (i.lineId || undefined) === (lineId || undefined);

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
    if (onPiilotettu(product.category)) return;
    const trimmedText = customText?.trim() ? customText.trim().slice(0, 200) : undefined;
    setItems(prev => {
      const existing = prev.find(i => samaRivi(i, product.id, selectedSize, selectedColor, trimmedText));
      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedColor, customText: trimmedText }];
    });
    setLastAddedItem({ product, size: selectedSize, color: selectedColor, customText: trimmedText });
    // GA4 add_to_cart
    const variant = [selectedSize, selectedColor].filter(Boolean).join(" / ") || undefined;
    trackAddToCart({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity,
      item_variant: variant,
      item_category: product.category,
    });
  }, []);

  /** Lahjakortti omalle rivilleen (saajan tiedot rivikohtaisia). */
  const addGiftCard = useCallback((product: Product, details: GiftCardDetails = {}) => {
    const lineId = `lk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const clean = (s?: string, max = 200) => (s?.trim() ? s.trim().slice(0, max) : undefined);
    const giftCard: GiftCardDetails = {
      recipientEmail: clean(details.recipientEmail),
      recipientName: clean(details.recipientName, 100),
      message: clean(details.message, 500),
    };
    setItems(prev => [...prev, { product, quantity: 1, lineId, giftCard }]);
    setLastAddedItem({ product });
    trackAddToCart({ item_id: product.id, item_name: product.name, price: product.price, quantity: 1, item_category: product.category });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string, selectedColor?: string, customText?: string, lineId?: string) => {
    setItems(prev => prev.filter(i => !samaRivi(i, productId, selectedSize, selectedColor, customText, lineId)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, selectedColor?: string, customText?: string, lineId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedColor, customText, lineId);
      return;
    }
    const existing = items.find(i => samaRivi(i, productId, selectedSize, selectedColor, customText, lineId));
    if (existing && quantity > existing.quantity) {
      const addedQuantity = quantity - existing.quantity;
      const variant = [existing.selectedSize, existing.selectedColor].filter(Boolean).join(" / ") || undefined;
      trackAddToCart({
        item_id: existing.product.id,
        item_name: existing.product.name,
        price: existing.product.price,
        quantity: addedQuantity,
        item_variant: variant,
        item_category: existing.product.category,
      });
    }
    setItems(prev => prev.map(i => samaRivi(i, productId, selectedSize, selectedColor, customText, lineId) ? { ...i, quantity } : i));
  }, [items, removeItem]);

  const clearCart = useCallback(() => setItems([]), []);
  const clearLastAdded = useCallback(() => setLastAddedItem(null), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return { items, addItem, addGiftCard, removeItem, updateQuantity, clearCart, totalItems, totalPrice, lastAddedItem, clearLastAdded };
}

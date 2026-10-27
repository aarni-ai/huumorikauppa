import { CartItem, Product } from "@/types/product";
import { useState, useEffect, useCallback } from "react";
import { trackAddToCart } from "@/lib/analytics";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { LOVABLE_KASSA_TAPPIO } from "../../api/_lib/lovable-kassa-tappio.js";

const CART_KEY = "huumorikauppa-cart";

const TAPPIO = new Map<string, Set<string>>(Object.entries(LOVABLE_KASSA_TAPPIO as Record<string, string[]>).map(([slug, avaimet]) => [slug, new Set(avaimet)]));
/** Lovablen kassan tappiollinen koko tai väri (api/_lib/lovable-kassa-tappio.js): ei koriin eikä kassalle. */
export const onTappioVariantti = (product: Pick<Product, "slug">, size?: string, color?: string): boolean =>
  !!TAPPIO.get(product?.slug)?.has(`${color ?? ""}|${size ?? ""}`);

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    const items: CartItem[] = stored ? JSON.parse(stored) : [];
    // Myynnistä piilotetut tuotteet (mukit 21.10.2026) pois tallennetusta korista.
    // Lisäksi Lovablen kassan tappiolliset koot (27.10.2026).
    return items.filter((i) => i?.product && !onPiilotettuTuote(i.product) && !onTappioVariantti(i.product, i.selectedSize, i.selectedColor));
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
    if (onPiilotettuTuote(product) || onTappioVariantti(product, selectedSize, selectedColor)) return;
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
    const existing = items.find(i =>
      i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor && (i.customText || undefined) === (customText || undefined)
    );
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
    setItems(prev => prev.map(i =>
      i.product.id === productId && i.selectedSize === selectedSize && i.selectedColor === selectedColor && (i.customText || undefined) === (customText || undefined)
        ? { ...i, quantity }
        : i
    ));
  }, [items, removeItem]);

  const clearCart = useCallback(() => setItems([]), []);
  const clearLastAdded = useCallback(() => setLastAddedItem(null), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, lastAddedItem, clearLastAdded };
}

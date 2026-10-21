export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  humor_type: string;
  price: number;
  original_price?: number;
  stock: number;
  description: string;
  images: string[];
  variants: Record<string, any>;
  is_featured: boolean;
  is_new: boolean;
  is_gift_idea: boolean;
  supplier?: string;
  aliexpress_url?: string;
  /** "giftcard" lahjakortilla (api/_lib/lahjakortti.js). */
  type?: string;
}

/** Lahjakortin saaja (valinnainen): koodi lähetetään myös saajalle. */
export interface GiftCardDetails {
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customText?: string;
  /** Oma rivitunnus (lahjakortit: jokainen saaja omalla rivillään). */
  lineId?: string;
  giftCard?: GiftCardDetails;
}

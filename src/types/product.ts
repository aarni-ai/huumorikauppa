export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  humor_type: string;
  price: number;
  stock: number;
  description: string;
  images: string[];
  variants: Record<string, any>;
  is_featured: boolean;
  is_new: boolean;
  is_gift_idea: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

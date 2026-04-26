import { categories } from "@/data/products";
import type { Product } from "@/types/product";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.name.toLowerCase()])
);

/**
 * Generates an SEO-optimized Finnish alt text for a product image.
 * Example: "Hauska Kalamies t-paita – suomalainen huumorituote Huumorikaupasta"
 */
export function productAlt(
  product: Pick<Product, "name" | "category">,
  context?: string
): string {
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category || "huumorituote";
  const ctx = context ? ` – ${context}` : "";
  return `${product.name} – hauska ${categoryLabel} Huumorikaupasta${ctx}`;
}

/**
 * Alt text for an additional/gallery image of the same product.
 */
export function productGalleryAlt(
  product: Pick<Product, "name" | "category">,
  index: number
): string {
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category || "huumorituote";
  return `${product.name} – ${categoryLabel} kuva ${index} | Huumorikauppa`;
}
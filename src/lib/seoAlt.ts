import type { Product } from "@/types/product";
import { productImageAlt } from "@/lib/productNames";

/**
 * Kuvaava alt-teksti tuotekuvalle (sama muoto kuin tuotesivulla ja tuotekortissa):
 * "Kalamies, t-paita, musta - kuva edestä"
 */
export function productAlt(
  product: Pick<Product, "name" | "category"> & { variants?: Record<string, unknown> },
  _context?: string,
  url?: string,
): string {
  return productImageAlt(product, { url });
}

/** Alt-teksti saman tuotteen lisäkuvalle (index alkaa 1:stä). */
export function productGalleryAlt(
  product: Pick<Product, "name" | "category"> & { variants?: Record<string, unknown> },
  index: number,
  url?: string,
): string {
  return productImageAlt(product, { url, index: Math.max(0, index - 1) });
}

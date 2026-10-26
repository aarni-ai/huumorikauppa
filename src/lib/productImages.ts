/**
 * Tuotesivun pääkuva: sama valinta ja sama srcset Reactissa (ProductPage) ja esirenderöinnin
 * <head>-preloadissa (src/seo/prerender), jotta selain lataa kuvan vain kerran.
 */
import { proxiedImage } from "./imageProxy";
import { availableColors } from "./variantAvailability";

/** /api/img-leveydet tuotesivun pääkuvalle (api/img.js pyöristää sallittuun leveyteen). */
export const PRODUCT_IMAGE_WIDTHS = [480, 800, 1200] as const;
/** Mobiilissa kuva on koko näytön levyinen, työpöydällä puolet sisältöalueesta. */
export const PRODUCT_IMAGE_SIZES = "(min-width: 1400px) 680px, (min-width: 768px) 50vw, 100vw";

interface ImageProduct {
  images: string[];
  variants?: Record<string, unknown> | null;
}

/**
 * Oletusväri, jonka kuvat tuotesivu näyttää ensimmäisenä: variants.default_color, jos sitä
 * valmistetaan, muuten ensimmäinen valmistettava väri (src/lib/variantAvailability.ts).
 * Sama valinta ProductPagessa ja esirenderöinnin preloadissa, jotta pääkuva ladataan kerran.
 */
export function defaultImageColor(product: ImageProduct & { slug?: string | null }): string | undefined {
  const variants = (product.variants ?? {}) as { colors?: string[]; sizes?: string[]; default_color?: string };
  const sellable = availableColors(product, variants.colors ?? [], variants.sizes ?? []);
  return variants.default_color && sellable.includes(variants.default_color) ? variants.default_color : sellable[0];
}

/** Kuvat oletusvärille (defaultImageColor), kuten ProductPage näyttää ne. */
export function defaultColorImages(product: ImageProduct & { slug?: string | null }): string[] {
  const variants = (product.variants ?? {}) as { variant_images?: Record<string, string[]> };
  const color = defaultImageColor(product);
  const own = color ? (variants.variant_images?.[color] ?? []).filter(Boolean) : [];
  return own.length > 0 ? own : (product.images ?? []).filter(Boolean);
}

/** src + srcset /api/img-leveyksillä. Ei srcsetiä, jos kuvaa ei ohjata välityspalvelimen kautta. */
export function productImageSources(url: string | undefined | null, opts: { absolute?: boolean } = {}): {
  src: string;
  srcSet?: string;
} {
  if (!url) return { src: "/placeholder.svg" };
  const src = proxiedImage(url, { ...opts, width: 800 });
  if (!src.includes("/api/img?")) return { src: src || url };
  const srcSet = PRODUCT_IMAGE_WIDTHS.map((w) => `${proxiedImage(url, { ...opts, width: w })} ${w}w`).join(", ");
  return { src, srcSet };
}

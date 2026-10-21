/**
 * Tuotesivun pääkuva: sama valinta ja sama srcset Reactissa (ProductPage) ja esirenderöinnin
 * <head>-preloadissa (src/seo/prerender), jotta selain lataa kuvan vain kerran.
 */
import { proxiedImage } from "./imageProxy";

/** /api/img-leveydet tuotesivun pääkuvalle (api/img.js pyöristää sallittuun leveyteen). */
export const PRODUCT_IMAGE_WIDTHS = [480, 800, 1200] as const;
/** Mobiilissa kuva on koko näytön levyinen, työpöydällä puolet sisältöalueesta. */
export const PRODUCT_IMAGE_SIZES = "(min-width: 1400px) 680px, (min-width: 768px) 50vw, 100vw";

interface ImageProduct {
  images: string[];
  variants?: Record<string, unknown> | null;
}

/** Kuvat oletusvärille (variants.default_color tai ensimmäinen väri), kuten ProductPage näyttää ne. */
export function defaultColorImages(product: ImageProduct): string[] {
  const variants = (product.variants ?? {}) as { colors?: string[]; default_color?: string; variant_images?: Record<string, string[]> };
  const colors = variants.colors ?? [];
  const color = variants.default_color && colors.includes(variants.default_color) ? variants.default_color : colors[0];
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

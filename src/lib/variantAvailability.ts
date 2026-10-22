/**
 * Printify-saatavuus: koko/väri-yhdistelmät, joita tuotteen print provider ei pysty valmistamaan.
 * Data: src/data/printify-saatavuus.json, jonka scripts/printify-saatavuus.mjs generoi Printifyn rajapinnasta.
 * Tyhjä data (products: {}) = kaikki yhdistelmät näytetään kuten ennenkin.
 *
 * Riippuvuudeton tiedosto (vain suhteelliset importit .js-päätteellä ja JSON import-attribuutilla), jotta
 * Edge-middleware (hiddenCategories.ts) ja Node-ajo voivat käyttää sitä ilman Viten aliaksia.
 */
import saatavuusData from "../data/printify-saatavuus.json" with { type: "json" };

export interface SaatavuusTuote {
  unavailable: string[];
  printify_product_id?: string | null;
  provider_id?: number | null;
}

export interface SaatavuusData {
  generated_at: string | null;
  products: Record<string, SaatavuusTuote>;
  kokonaan_ei_saatavilla?: string[];
  summary?: unknown;
}

/** Sama avainmuoto kuin variants.variant_map: "Väri|Koko", ilman väriä "|Koko". */
export const variantKey = (color?: string | null, size?: string | null): string => `${color ?? ""}|${size ?? ""}`;

export function createAvailability(data: SaatavuusData) {
  const unavailable = new Map<string, Set<string>>();
  for (const [slug, p] of Object.entries(data?.products ?? {})) {
    if (Array.isArray(p?.unavailable) && p.unavailable.length > 0) unavailable.set(slug, new Set(p.unavailable));
  }
  const kokonaan = new Set(data?.kokonaan_ei_saatavilla ?? []);

  const isVariantAvailable = (slug: string | null | undefined, color?: string | null, size?: string | null): boolean => {
    if (!slug) return true;
    if (kokonaan.has(slug)) return false;
    const set = unavailable.get(slug);
    return !set || !set.has(variantKey(color, size));
  };

  /** Valitulle värille valmistettavat koot (järjestys säilyy). Ilman väriä avain on "|Koko". */
  const availableSizes = (slug: string | null | undefined, color: string | null | undefined, sizes: readonly string[]): string[] =>
    sizes.filter((s) => isVariantAvailable(slug, color, s));

  /** Värit, joilla on vähintään yksi valmistettava koko (tai kokoton yhdistelmä, jos kokoja ei ole). */
  const availableColors = (slug: string | null | undefined, colors: readonly string[], sizes: readonly string[] = []): string[] =>
    colors.filter((c) => (sizes.length > 0 ? availableSizes(slug, c, sizes).length > 0 : isVariantAvailable(slug, c, "")));

  /** Onko tuotteella yhtään valmistettavaa yhdistelmää annetuista väreistä ja koista. */
  const hasAvailableVariant = (slug: string | null | undefined, colors: readonly string[] = [], sizes: readonly string[] = []): boolean => {
    if (!slug) return true;
    if (kokonaan.has(slug)) return false;
    const cs = colors.length > 0 ? colors : [""];
    const ss = sizes.length > 0 ? sizes : [""];
    return cs.some((c) => ss.some((s) => isVariantAvailable(slug, c, s)));
  };

  /** Tuote, jonka mitään yhdistelmää ei voi valmistaa: piilotetaan kuten myynnistä poistetut. */
  const isFullyUnavailable = (slug: string | null | undefined): boolean => !!slug && kokonaan.has(slug);

  return { isVariantAvailable, availableSizes, availableColors, hasAvailableVariant, isFullyUnavailable };
}

const oletus = createAvailability(saatavuusData as SaatavuusData);

export const isVariantAvailable = oletus.isVariantAvailable;
export const availableSizes = oletus.availableSizes;
export const availableColors = oletus.availableColors;
export const hasAvailableVariant = oletus.hasAvailableVariant;
export const isFullyUnavailable = oletus.isFullyUnavailable;

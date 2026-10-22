/**
 * Printify-saatavuus: koko/väri-yhdistelmät, joita ei voi tilata.
 *
 * Kaksi lähdettä:
 *   1. Tuotteen oma variants.variant_map: jos kartta ei ole tyhjä eikä siinä ole avainta "Väri|Koko"
 *      ("|Koko" ilman väriä, "Väri|" ilman kokoa), kassa ei löydä Printify-varianttia, joten yhdistelmä
 *      on valmistamaton. Tähän ei tarvita erillistä dataa.
 *   2. src/data/printify-saatavuus.json (scripts/printify-saatavuus.mjs): kartassa olevat variantit, joita
 *      Printify ei valmista (ei käytössä, ei saatavilla, ei providerin katalogissa), sekä kokonaan
 *      valmistamattomat tuotteet (kaikki syyt mukaan lukien kartan aukot).
 *
 * Data luetaan generoidusta JS-moduulista (api/_lib/printify-saatavuus.js, sama sisältö kuin JSON-tiedostossa),
 * koska JSON-import ei käänny Vercelin middleware-buildissa. Vain suhteelliset importit .js-päätteellä.
 */
import { SAATAVUUS_DATA as saatavuusData } from "../../api/_lib/printify-saatavuus.js";

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

/** Tuote tai sen osa: slug ja variants (colors, sizes, variant_map). Kumpikin voi puuttua. */
export interface SaatavuusKohde {
  slug?: string | null;
  variants?: unknown;
  /** Oma tausta: päivittäisen Printify-tarkistuksen tulos tuoterivillä (api/_lib/saatavuus.js). */
  unavailable_variants?: unknown;
}

/** Sama avainmuoto kuin variants.variant_map: "Väri|Koko", ilman väriä "|Koko", ilman kokoa "Väri|". */
export const variantKey = (color?: string | null, size?: string | null): string => `${color ?? ""}|${size ?? ""}`;

function variantMapOf(p: SaatavuusKohde | null | undefined): Record<string, unknown> | null {
  const map = (p?.variants as { variant_map?: unknown } | null | undefined)?.variant_map;
  if (!map || typeof map !== "object" || Array.isArray(map)) return null;
  return Object.keys(map).length > 0 ? (map as Record<string, unknown>) : null;
}

const listOf = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function createAvailability(data: SaatavuusData) {
  const unavailable = new Map<string, Set<string>>();
  for (const [slug, p] of Object.entries(data?.products ?? {})) {
    if (Array.isArray(p?.unavailable) && p.unavailable.length > 0) unavailable.set(slug, new Set(p.unavailable));
  }
  const kokonaan = new Set(data?.kokonaan_ei_saatavilla ?? []);

  const isVariantAvailable = (p: SaatavuusKohde | null | undefined, color?: string | null, size?: string | null): boolean => {
    const slug = p?.slug;
    if (slug && kokonaan.has(slug)) return false;
    const key = variantKey(color, size);
    const map = variantMapOf(p);
    if (map && !(key in map)) return false;
    if (listOf(p?.unavailable_variants).includes(key)) return false;
    const set = slug ? unavailable.get(slug) : undefined;
    return !set || !set.has(key);
  };

  /** Valitulle värille valmistettavat koot (järjestys säilyy). */
  const availableSizes = (p: SaatavuusKohde | null | undefined, color: string | null | undefined, sizes: readonly string[]): string[] =>
    sizes.filter((s) => isVariantAvailable(p, color, s));

  /** Värit, joilla on vähintään yksi valmistettava koko (tai kokoton yhdistelmä "Väri|", jos kokoja ei ole). */
  const availableColors = (p: SaatavuusKohde | null | undefined, colors: readonly string[], sizes: readonly string[] = []): string[] =>
    colors.filter((c) => (sizes.length > 0 ? availableSizes(p, c, sizes).length > 0 : isVariantAvailable(p, c, "")));

  /** Onko tuotteella yhtään valmistettavaa yhdistelmää omista väreistään ja koistaan. */
  const hasAvailableVariant = (p: SaatavuusKohde | null | undefined): boolean => {
    if (p?.slug && kokonaan.has(p.slug)) return false;
    const v = p?.variants as { colors?: unknown; sizes?: unknown } | null | undefined;
    const cs = listOf(v?.colors);
    const ss = listOf(v?.sizes);
    return (cs.length > 0 ? cs : [""]).some((c) => (ss.length > 0 ? ss : [""]).some((s) => isVariantAvailable(p, c, s)));
  };

  /**
   * Tuote, jonka mitään yhdistelmää ei voi valmistaa: piilotetaan kuten myynnistä poistetut.
   * Generaattorin lista aina; lisäksi tuotteen omista varianteista, kun ne ovat mukana.
   */
  const isFullyUnavailable = (p: SaatavuusKohde | null | undefined): boolean => {
    if (!p) return false;
    if (p.slug && kokonaan.has(p.slug)) return true;
    return variantMapOf(p) !== null && !hasAvailableVariant(p);
  };

  return { isVariantAvailable, availableSizes, availableColors, hasAvailableVariant, isFullyUnavailable };
}

const oletus = createAvailability(saatavuusData as SaatavuusData);

export const isVariantAvailable = oletus.isVariantAvailable;
export const availableSizes = oletus.availableSizes;
export const availableColors = oletus.availableColors;
export const hasAvailableVariant = oletus.hasAvailableVariant;
export const isFullyUnavailable = oletus.isFullyUnavailable;

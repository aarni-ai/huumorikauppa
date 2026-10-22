/**
 * Varianttien saatavuus selaimessa (oma tausta). Lähde on tuoterivin kenttä unavailable_variants (/api/products,
 * päivittäinen Printify-tarkistus api/_lib/saatavuus.js): lista variant_map-avaimia "Väri|Koko". /api/products on
 * jo karsinut saatavuudettomat yhdistelmät variant_map-kartasta sekä värit ja koot, joilla ei ole yhtään saatavaa
 * yhdistelmää; tällä tarkistetaan yksittäinen yhdistelmä (esim. Musta|S loppu, Valkoinen|S saatavilla).
 * Mainin src/data/printify-saatavuus.json (products[slug].unavailable) käyttää samaa avainmuotoa.
 */
interface SaatavuusTuote {
  unavailable_variants?: unknown;
  variants?: { variant_map?: Record<string, unknown> } | null;
}

/** Saatavuudettomat avaimet "Väri|Koko". */
export function unavailableKeys(product: SaatavuusTuote | null | undefined): Set<string> {
  const v = product?.unavailable_variants;
  return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
}

/** Onko väri ja koko -yhdistelmä saatavilla. Tuntematon (ei listassa) on saatavilla. */
export function isVariantAvailable(product: SaatavuusTuote | null | undefined, color?: string, size?: string): boolean {
  const pois = unavailableKeys(product);
  if (pois.size === 0) return true;
  return !pois.has(`${(color || "").trim()}|${(size || "").trim()}`);
}

/** Koot, jotka ovat saatavilla valitulle värille (järjestys säilyy). */
export function availableSizes(product: SaatavuusTuote | null | undefined, color: string | undefined, sizes: string[]): string[] {
  return sizes.filter((s) => isVariantAvailable(product, color, s));
}

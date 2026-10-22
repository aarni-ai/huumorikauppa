/**
 * Myynnistä piilotetut kategoriat (21.10.2026: mukit pois myynnistä).
 * Yksi lähde: tuotelistat, tuote- ja kategoriasivut, ostoskori, navigaatio, sivukartta ja Merchant-syöte
 * käyttävät tätä. Mukisivut ohjautuvat 301:llä /kaikki-tuotteet (vercel.json). Palautus: poista kategoria listalta
 * ja vercel.json:n mukiohjaukset.
 *
 * Lisäksi piilotetaan tuotteet, joiden yhtään koko/väri-yhdistelmää Printify ei pysty valmistamaan
 * (src/data/printify-saatavuus.json, kokonaan_ei_saatavilla; generaattori scripts/printify-saatavuus.mjs).
 */
import { isFullyUnavailable } from "./variantAvailability.js";

export const PIILOTETUT_KATEGORIAT: readonly string[] = ["mukit"];

export const onPiilotettu = (category: string | undefined | null): boolean =>
  !!category && PIILOTETUT_KATEGORIAT.includes(category);

/** Muki nimen, osoitteen tai koon perusteella (kolme mukia on tietokannassa t-paidat-kategoriassa, koko 11oz). */
export const MUKI_TUNNISTE = /\bmuki\b|kahvimuki|-muki$/i;

/**
 * Tuotetasoinen piilotus: piilotettu kategoria tai muki muussa kategoriassa. Käytä tätä aina, kun tuoterivi on
 * käytettävissä (listat, kori, esirenderöinti, sivukartta, syöte, middleware).
 */
export function onPiilotettuTuote(p: { category?: string | null; slug?: string | null; name?: string | null; variants?: unknown }): boolean {
  if (onPiilotettu(p.category)) return true;
  if (isFullyUnavailable(p.slug)) return true;
  if (MUKI_TUNNISTE.test(`${p.slug ?? ""} ${p.name ?? ""}`)) return true;
  const koot = (p.variants as { sizes?: unknown } | null | undefined)?.sizes;
  return Array.isArray(koot) && koot.some((k) => typeof k === "string" && /^\d+oz$/i.test(k));
}

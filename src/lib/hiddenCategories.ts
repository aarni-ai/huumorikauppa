/**
 * Myynnistä piilotetut kategoriat (21.10.2026: mukit pois myynnistä).
 * Yksi lähde: tuotelistat, tuote- ja kategoriasivut, ostoskori, navigaatio, sivukartta ja Merchant-syöte
 * käyttävät tätä. Mukisivut ohjautuvat 301:llä /kaikki-tuotteet (vercel.json). Palautus: poista kategoria listalta
 * ja vercel.json:n mukiohjaukset.
 *
 * Lisäksi piilotetaan tuotteet, joiden yhtään koko/väri-yhdistelmää Printify ei pysty valmistamaan
 * (src/lib/variantAvailability.ts: tuotteen variant_map sekä src/data/printify-saatavuus.json), sekä Lovable-
 * synkronoinnin kaksoiskappaleet ja Printify-testikopiot (api/_lib/kaksoiskappaleet.js).
 *
 * 27.10.2026: myös EU:n ulkopuolella tai Printify Choicen reitityksellä valmistettavat tuotteet (api/_lib/eu-reititys.js,
 * generaattori scripts/eu-reititys.mjs). Ne, joilla on näkyvä EU-kopio, ohjataan 301:llä kopioon (middleware.ts).
 */
import { isFullyUnavailable } from "./variantAvailability.js";
import { onKaksoiskappaleTaiTestikopio } from "../../api/_lib/kaksoiskappaleet.js";
import { onEuReititetty } from "../../api/_lib/eu-reititys.js";

export const PIILOTETUT_KATEGORIAT: readonly string[] = ["mukit"];

export const onPiilotettu = (category: string | undefined | null): boolean =>
  !!category && PIILOTETUT_KATEGORIAT.includes(category);

/** Muki nimen, osoitteen tai koon perusteella (kolme mukia on tietokannassa t-paidat-kategoriassa, koko 11oz). */
export const MUKI_TUNNISTE = /\bmuki\b|kahvimuki|-muki$/i;

/**
 * Tuotetasoinen piilotus: piilotettu kategoria tai muki muussa kategoriassa. Käytä tätä aina, kun tuoterivi on
 * käytettävissä (listat, kori, esirenderöinti, sivukartta, syöte, middleware).
 */
export function onPiilotettuTuote(p: TuoteRivi): boolean {
  return onPiilotettuTuotePerus(p) || onEuReititetty(p);
}

type TuoteRivi = { category?: string | null; slug?: string | null; name?: string | null; variants?: unknown; printify_product_id?: string | null };

/** Piilotus ilman EU-reititystä (scripts/eu-reititys.mjs laskee näkyvyyden tällä, ettei vanha data vaikuta). */
export function onPiilotettuTuotePerus(p: TuoteRivi): boolean {
  if (onPiilotettu(p.category)) return true;
  if (onKaksoiskappaleTaiTestikopio(p.slug)) return true;
  if (isFullyUnavailable(p)) return true;
  if (MUKI_TUNNISTE.test(`${p.slug ?? ""} ${p.name ?? ""}`)) return true;
  const koot = (p.variants as { sizes?: unknown } | null | undefined)?.sizes;
  return Array.isArray(koot) && koot.some((k) => typeof k === "string" && /^\d+oz$/i.test(k));
}

/**
 * EU-reititys (27.10.2026): kauppatuotteet, joiden Printify-tuote painetaan EU:n ulkopuolella tai Printify Choicen
 * reitityksellä (voi painaa Yhdysvalloissa). Data generoidaan: scripts/eu-reititys.mjs -> api/_lib/eu-reititys-data.js.
 *
 *   - EU_OHJAUKSET: slug -> EU-kopion näkyvä slug (middleware.ts 301)
 *   - EU_PIILOTETUT: slug -> Printify-tuote, jonka takia rivi piilotettiin (middleware 301 /kaikki-tuotteet)
 *   - EI_EU_PRINTIFY_TUOTTEET: kaikki EU:n ulkopuoliset Printify-tuotteet. Rivi piilotetaan myös, jos Lovablen
 *     yöllinen synkronointi osoittaa sen ajojen välillä johonkin näistä.
 *
 * Kun rivin printify_product_id on tiedossa (kauppa, middleware, sivukartta), piilotus seuraa sitä: rivi, jonka
 * synkronointi on osoittanut piilotuksen jälkeen muuhun kuin EU:n ulkopuoliseen tuotteeseen, näkyy taas. Ilman
 * tunnusta (ostoskori, Merchant-syöte) päätös tehdään slugista.
 */
import { EU_OHJAUKSET, EU_PIILOTETUT, EI_EU_PRINTIFY_TUOTTEET } from "./eu-reititys-data.js";

const OHJAUKSET = new Map(Object.entries(EU_OHJAUKSET));
const PIILOTETUT = new Map(Object.entries(EU_PIILOTETUT));
const EI_EU = new Set(EI_EU_PRINTIFY_TUOTTEET);

/** EU-kopion slug, johon slug ohjataan 301:llä, tai null. */
export function euOhjausKohde(slug) {
  return OHJAUKSET.get(String(slug || "")) ?? null;
}

/** Slug poistetaan kaupasta, sivukartasta ja syötteestä (ohjattu tai piilotettu). */
export function onEuReititettySlug(slug) {
  const s = String(slug || "");
  return OHJAUKSET.has(s) || PIILOTETUT.has(s);
}

/** Rivi ({ slug, printify_product_id? }) valmistetaan EU:n ulkopuolella. */
export function onEuReititetty(p) {
  if (!p) return false;
  const slug = String(p.slug || "");
  const id = p.printify_product_id ? String(p.printify_product_id) : null;
  if (OHJAUKSET.has(slug)) return true;
  if (id && EI_EU.has(id)) return true;
  if (PIILOTETUT.has(slug)) return !id || PIILOTETUT.get(slug) === id;
  return false;
}

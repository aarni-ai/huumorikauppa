/**
 * Tilausvahti ennen Printifyn tuotantoa (26.10.2026, Liisan muki: Printify-kulu 39,06 vs myynti 26,80 €, painettu
 * Yhdysvalloissa, KATTEET.md). Ennen send_to_production haetaan luotu Printify-tilaus ja tarkistetaan:
 *   1. jokaisen rivin painotalo on EU:ssa (katalogin /catalog/print_providers/{id}.json location.country, varalla
 *      tilausrivin metadata.country). Printify Choice (id 99) on reititysverkko, joka valitsee painotalon tilauskohtaisesti:
 *      se hyväksytään vain, jos tilausrivi itse kertoo EU-maan.
 *   2. Printifyn kulu ilman alv:tä (total_price + total_shipping) ei ylitä tilauksen myyntiä ilman alv:tä
 *      ((total - ostetut lahjakortit) / 1,255). Tmi Inteller on ALV-rekisterissä (FI35836772): Printifyn veloittama alv
 *      (total_tax) vähennetään ALV-ilmoituksessa, joten se ei ole kulu.
 * Jos jompikumpi ei täyty, tilausta ei lähetetä tuotantoon: tila 'pysaytetty', hälytys omistajalle heti, eikä valvonta
 * yritä uudelleen (omistaja päättää: lähettää Printifyn hallinnasta tuotantoon tai peruu).
 * Puhdas moduuli: Printify-haku annetaan parametrina (testit mockaavat fetchin).
 */
import { ALV } from "./kate.js";
import { maaKoodi, onEU } from "./eu.js";

export const PRINTIFY_CHOICE_ID = 99;
const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Printify-tilauksen kulut euroina (sentit / 100; tilin valuutta oletetaan euroksi). null, jos summia ei ole.
 * kulu = ilman alv:tä (vähennettävä, 27.10.2026 omistajan linjaus); kuluSisAlv vain tiedoksi.
 */
export function printifyKulut(o) {
  const n = (x) => (typeof x === "number" && Number.isFinite(x) ? x : null);
  const hinta = n(o?.total_price), toimitus = n(o?.total_shipping);
  if (hinta === null || toimitus === null) return null;
  const vero = n(o?.total_tax) ?? 0;
  return { kulu: r2((hinta + toimitus) / 100), kuluIlmanAlv: r2((hinta + toimitus) / 100), kuluSisAlv: r2((hinta + toimitus + vero) / 100), tuotteet: r2(hinta / 100), toimitus: r2(toimitus / 100), vero: r2(vero / 100) };
}

/** Oman tilauksen myynti (sis. alv) ilman ostettuja lahjakortteja ja sama ilman alv:tä. */
export function tilauksenMyynti(tilaus) {
  const kortit = (tilaus?.items || []).filter((i) => i.type === "giftcard").reduce((s, i) => s + Number(i.unit_price) * (i.quantity || 1), 0);
  const myynti = Number(tilaus?.total) - kortit;
  return { myynti: r2(myynti), myyntiAlv0: r2(myynti / (1 + ALV)) };
}

/** Painotalojen välimuisti (id -> { nimi, maa } tai null). Moduulin tasolla: sama serverless-instanssi käyttää uudelleen. */
const painotalot = new Map();
export const tyhjennaPainotalot = () => painotalot.clear();

/** hae(id) -> { ok, data } (api/_lib/printify.js haePainotalo). Epäonnistunut haku ei jää välimuistiin. */
export async function painotalo(id, hae) {
  if (id == null) return null;
  const k = String(id);
  if (painotalot.has(k)) return painotalot.get(k);
  const r = await hae(id);
  if (!r?.ok || !r.data) return null;
  const tieto = { nimi: r.data.title || `#${id}`, maa: maaKoodi(r.data.location?.country) };
  painotalot.set(k, tieto);
  return tieto;
}

/** Yhden tilausrivin painotalo ja maa: { providerId, nimi, maa, choice, eu, syy }. maa null = ei todennettavissa. */
export async function rivinPainotalo(rivi, hae) {
  const id = rivi?.print_provider_id ?? null;
  const kat = await painotalo(id, hae);
  const riviMaa = maaKoodi(rivi?.metadata?.country);
  const choice = Number(id) === PRINTIFY_CHOICE_ID || /printify choice/i.test(kat?.nimi || "");
  const nimi = kat?.nimi || (id != null ? `#${id}` : "?");
  if (choice) {
    // Reititysverkko: katalogin osoite (Miami) ei kerro painotaloa. Vain tilausrivin oma EU-maa kelpaa.
    const eu = !!riviMaa && onEU(riviMaa);
    return { providerId: id, nimi, maa: riviMaa, choice, eu, syy: eu ? null : `Printify Choice ilman EU-painotaloa (tilausrivi: ${riviMaa || "maa puuttuu"})` };
  }
  const maat = [kat?.maa, riviMaa].filter(Boolean);
  if (!maat.length) return { providerId: id, nimi, maa: null, choice, eu: null, syy: `painotalon ${nimi} maata ei saatu` };
  const euUlkopuolinen = maat.find((m) => !onEU(m));
  return { providerId: id, nimi, maa: euUlkopuolinen || maat[0], choice, eu: !euUlkopuolinen, syy: euUlkopuolinen ? `painotalo ${nimi} EU:n ulkopuolella (${euUlkopuolinen})` : null };
}

/**
 * Tarkistus ennen tuotantoa. Palauttaa { tulos, syyt, rivit, kulut, myynti, myyntiAlv0 }:
 *   tulos "ok"         lähetetään tuotantoon
 *         "pysayta"    EU:n ulkopuolinen painotalo tai kulu yli myynnin alv 0: ei tuotantoon, omistaja päättää
 *         "tuntematon" maata tai kuluja ei saatu (verkkovirhe tms.): tavallinen virhe ja uudelleenyritys
 */
export async function tarkistaEnnenTuotantoa(printifyTilaus, tilaus, { haePainotalo }) {
  const rivit = [];
  for (const r of printifyTilaus?.line_items || []) {
    rivit.push({ product_id: r.product_id, title: r.metadata?.title || r.product_id, quantity: r.quantity, ...(await rivinPainotalo(r, haePainotalo)) });
  }
  const kulut = printifyKulut(printifyTilaus);
  const { myynti, myyntiAlv0 } = tilauksenMyynti(tilaus);
  const pysayta = [];
  const tuntematon = [];
  if (!rivit.length) tuntematon.push("Printify-tilauksella ei ole rivejä");
  for (const r of rivit) {
    if (r.eu === false) pysayta.push(`${r.title}: ${r.syy}`);
    else if (r.eu === null) tuntematon.push(`${r.title}: ${r.syy}`);
  }
  if (!kulut) tuntematon.push("Printify-tilauksen kuluja ei ole (total_price puuttuu)");
  else if (kulut.kulu > myyntiAlv0) {
    pysayta.push(`Printifyn kulu ${eur(kulut.kulu)} (sis. Printifyn alv ${eur(kulut.vero)}) ylittää myynnin ilman alv:tä ${eur(myyntiAlv0)}`);
  }
  const tulos = pysayta.length ? "pysayta" : tuntematon.length ? "tuntematon" : "ok";
  return { tulos, syyt: pysayta.length ? pysayta : tuntematon, rivit, kulut, myynti, myyntiAlv0 };
}

export const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;

/** Hälytyksen rivit pysäytetystä tilauksesta. */
export function pysaytysRivit(tilaus, printifyId, t) {
  return [
    ...t.syyt.map((s) => `Syy: ${s}`),
    `Tilaus: ${tilaus.id}`,
    `Printify-tilaus: ${printifyId} (on hold, ei lähetetty tuotantoon)`,
    `Myynti ${eur(t.myynti)} (sis. alv), ilman alv:tä ${eur(t.myyntiAlv0)}`,
    t.kulut ? `Printifyn kulu ${eur(t.kulut.kulu)} (tuotteet ${eur(t.kulut.tuotteet)} + toimitus ${eur(t.kulut.toimitus)} + alv ${eur(t.kulut.vero)}), ilman alv:tä ${eur(t.kulut.kuluIlmanAlv)}` : "Printifyn kulu: ei tiedossa",
    ...t.rivit.map((r) => `${r.quantity} x ${r.title}: ${r.nimi} (${r.maa || "maa ?"})${r.eu ? "" : ", EI EU"}`),
    "Valvonta ei yritä uudelleen. Päätä itse: lähetä tuotantoon Printifyn hallinnasta (valvonta seuraa sen jälkeen normaalisti) tai peru tilaus ja hyvitä asiakas.",
  ];
}

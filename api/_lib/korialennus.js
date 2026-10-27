/**
 * Kahden tuotteen alennus (korialennus). Puhdas moduuli: kassa (palvelin, api/_lib/kassa.js) laskee lopullisen
 * alennuksen, ostoskori ja kassasivu (selain, src/lib/ostoskori.ts) näyttävät saman laskennan arviona.
 *
 * Säännöt (vakiot api/_lib/vakiot.js):
 * - Korissa vähintään KORIALENNUS_MIN_KPL fyysistä tuotetta (kappaleina, lahjakortit eivät lasketa).
 * - Ei alennuskoodia (kassa kutsuu tätä vain ilman koodia).
 * - Alennus KORIALENNUS_PROSENTTI koskee rivejä, jotka eivät ole jo pakettialennuksessa.
 * - Katevahti: alennus annetaan vain, jos koko tilauksen nettokate alennuksen jälkeen (todellinen Printify-toimitus
 *   painotaloittain, api/_lib/kate.js laskeTilauksenNettokate) on vähintään KORIALENNUS_MIN_KATE_EUROA eikä
 *   negatiivinen. Tuntematon kulu: ei alennusta.
 * - Ilmaisen toimituksen raja lasketaan alennusta edeltävästä summasta (kassa).
 */
import { laskeTilauksenNettokate } from "./kate.js";
import { KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, KORIALENNUS_MIN_KATE_EUROA } from "./vakiot.js";

export { KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, KORIALENNUS_MIN_KATE_EUROA };

const OLETUS = { prosentti: KORIALENNUS_PROSENTTI, minKpl: KORIALENNUS_MIN_KPL, minKateEuroa: KORIALENNUS_MIN_KATE_EUROA };

/**
 * @param rivit kassan fyysiset rivit [{ slug, variant_id, quantity, unit_cents, paketti? }]
 * @param tuotteetSlugilla Map slug -> tuoterivi (kulut)
 * @param toimitusmaksu asiakkaan maksama toimitus euroina
 * @param asetukset { prosentti, minKpl, minKateEuroa } (oletus vakiot.js)
 * Palauttaa { rivit, alennus (euroa), prosentti, syy } ; syy: null (annettu), "kpl", "pois", "ei_rivia", "kulu", "kate".
 * Alkuperäiset rivit palautetaan muuttamattomina, jos alennusta ei anneta.
 */
export function sovellaKorialennus(rivit, tuotteetSlugilla, toimitusmaksu, asetukset = {}) {
  const { prosentti, minKpl, minKateEuroa } = { ...OLETUS, ...asetukset };
  const ei = (syy, nettokate = null) => ({ rivit, alennus: 0, prosentti: 0, syy, nettokate });
  if (!(prosentti > 0 && prosentti < 50)) return ei("pois");
  const kpl = rivit.reduce((s, r) => s + r.quantity, 0);
  if (kpl < minKpl) return ei("kpl");
  if (!rivit.some((r) => !r.paketti)) return ei("ei_rivia");
  let alennusSentteina = 0;
  const uudet = rivit.map((r) => {
    if (r.paketti) return r;
    const alennettu = Math.round(r.unit_cents * (1 - prosentti / 100));
    alennusSentteina += (r.unit_cents - alennettu) * r.quantity;
    return { ...r, unit_cents: alennettu, korialennus_prosentti: prosentti };
  });
  const osat = [];
  for (const r of uudet) {
    const tuote = tuotteetSlugilla.get(r.slug);
    if (!tuote) return ei("kulu");
    osat.push({ tuote, varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100 });
  }
  const kate = laskeTilauksenNettokate(osat, toimitusmaksu);
  if (!kate.tunnettu) return ei("kulu");
  if (kate.nettokate < 0 || kate.nettokate < minKateEuroa) return ei("kate", kate.nettokate);
  return { rivit: uudet, alennus: alennusSentteina / 100, prosentti, syy: null, nettokate: kate.nettokate };
}

/** Kallein variantti (tuotekulu): selaimen arvio, kun korin rivin varianttia ei vielä tunneta. */
export function kalleinVariantti(tuote) {
  const kulut = tuote?.variants?.costs || {};
  let paras = null;
  for (const id of Object.values(tuote?.variants?.variant_map || {})) {
    const k = kulut[String(id)];
    if (typeof k === "number" && (paras === null || k > kulut[String(paras)])) paras = id;
  }
  return paras;
}

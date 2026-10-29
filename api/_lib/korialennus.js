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
import { KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, KORIALENNUS_MIN_KATE_EUROA, TPAITAPARI_KAMPANJA, MAARAALENNUS } from "./vakiot.js";

export { KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, KORIALENNUS_MIN_KATE_EUROA, TPAITAPARI_KAMPANJA, MAARAALENNUS };

const OLETUS = { prosentti: KORIALENNUS_PROSENTTI, minKpl: KORIALENNUS_MIN_KPL, minKateEuroa: KORIALENNUS_MIN_KATE_EUROA, kampanja: TPAITAPARI_KAMPANJA, maara: MAARAALENNUS };

/** Päivä Suomen aikaa (YYYY-MM-DD). */
const helsinginPaiva = (nyt) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(nyt);

/** Onko t-paitaparikampanja voimassa hetkellä nyt (käytössä ja alku <= päivä <= loppu Suomen aikaa). */
export function tpaitapariVoimassa(kampanja = TPAITAPARI_KAMPANJA, nyt = new Date()) {
  if (!kampanja?.kaytossa) return false;
  const p = helsinginPaiva(nyt);
  return p >= kampanja.alku && p <= kampanja.loppu;
}

/** Määräalennuksen porras kampanjan t-paitojen määrälle (suurin, jonka minimi täyttyy), tai null. */
export function maaraPorras(kpl, maara = MAARAALENNUS) {
  if (!maara?.kaytossa) return null;
  return [...maara.portaat].sort((a, b) => b.min - a.min).find((p) => kpl >= p.min) ?? null;
}

/** Kuinka monta määräalennukseen kelpaavaa t-paitaa riveillä on. */
export function maaraKelpaavat(rivit, tuotteetSlugilla, maara = MAARAALENNUS) {
  const kappale = Math.round(maara.kappalehinta * 100);
  return rivit.filter((r) => !r.paketti && r.unit_cents === kappale && tuotteetSlugilla.get(r.slug)?.category === maara.kategoria)
    .reduce((s, r) => s + r.quantity, 0);
}

/**
 * Parihinnan rivit: jokainen täysi pari kampanjan t-paitoja (kappalehinta 24,90 €) maksaa parihinnan. Alennus jaetaan
 * tasan kaikille kampanjan t-paitakappaleille ja pyöristetään sentin ylöspäin asiakkaan hyväksi (pariton paita
 * jakaa alennuksen). Palauttaa { rivit, alennusSentteina } tai null, jos pareja ei ole.
 */
function tpaitapariRivit(rivit, tuotteetSlugilla, kampanja) {
  const kappale = Math.round(kampanja.kappalehinta * 100);
  const pari = Math.round(kampanja.parihinta * 100);
  const kelpaa = (r) => !r.paketti && r.unit_cents === kappale && tuotteetSlugilla.get(r.slug)?.category === kampanja.kategoria;
  const n = rivit.filter(kelpaa).reduce((s, r) => s + r.quantity, 0);
  const parit = Math.floor(n / 2);
  if (parit < 1 || pari >= 2 * kappale) return null;
  const perKpl = Math.ceil((parit * (2 * kappale - pari)) / n);
  let alennusSentteina = 0;
  const uudet = rivit.map((r) => {
    if (!kelpaa(r)) return r;
    alennusSentteina += perKpl * r.quantity;
    return { ...r, unit_cents: r.unit_cents - perKpl, tpaitapari: true };
  });
  return { rivit: uudet, alennusSentteina };
}

/**
 * @param rivit kassan fyysiset rivit [{ slug, variant_id, quantity, unit_cents, paketti? }]
 * @param tuotteetSlugilla Map slug -> tuoterivi (kulut)
 * @param toimitusmaksu asiakkaan maksama toimitus euroina
 * @param asetukset { prosentti, minKpl, minKateEuroa } (oletus vakiot.js)
 * Palauttaa { rivit, alennus (euroa), prosentti, syy } ; syy: null (annettu), "kpl", "pois", "ei_rivia", "kulu", "kate".
 * Alkuperäiset rivit palautetaan muuttamattomina, jos alennusta ei anneta.
 */
export function sovellaKorialennus(rivit, tuotteetSlugilla, toimitusmaksu, asetukset = {}) {
  const { prosentti, minKpl, minKateEuroa, kampanja, nyt, maara } = { ...OLETUS, ...asetukset };
  const ei = (syy, nettokate = null) => ({ rivit, alennus: 0, prosentti: 0, syy, nettokate });
  const pariVoimassa = tpaitapariVoimassa(kampanja, nyt ?? new Date());
  if (!(prosentti > 0 && prosentti < 50) && !pariVoimassa && !maara?.kaytossa) return ei("pois");
  const kpl = rivit.reduce((s, r) => s + r.quantity, 0);
  if (kpl < minKpl) return ei("kpl");
  if (!rivit.some((r) => !r.paketti)) return ei("ei_rivia");

  // Vaihtoehdot: kahden tuotteen -X % ja (kampanjan aikana) t-paitapari. Asiakas saa suuremman, joka läpäisee katevahdin.
  const vaihtoehdot = [];
  if (prosentti > 0 && prosentti < 50) {
    let alennusSentteina = 0;
    const uudet = rivit.map((r) => {
      if (r.paketti) return r;
      const alennettu = Math.round(r.unit_cents * (1 - prosentti / 100));
      alennusSentteina += (r.unit_cents - alennettu) * r.quantity;
      return { ...r, unit_cents: alennettu, korialennus_prosentti: prosentti };
    });
    vaihtoehdot.push({ rivit: uudet, alennusSentteina, prosentti, tyyppi: "prosentti" });
  }
  if (pariVoimassa) {
    const p = tpaitapariRivit(rivit, tuotteetSlugilla, kampanja);
    if (p) vaihtoehdot.push({ ...p, prosentti: 0, tyyppi: "tpaitapari" });
  }
  // Määräalennus (yritykset, ryhmät): porras t-paitojen määrän mukaan, koskee vain kelpaavia t-paitarivejä.
  const kelpaavat = maara?.kaytossa ? maaraKelpaavat(rivit, tuotteetSlugilla, maara) : 0;
  const porras = maaraPorras(kelpaavat, maara);
  if (porras) {
    const kappale = Math.round(maara.kappalehinta * 100);
    let alennusSentteina = 0;
    const uudet = rivit.map((r) => {
      if (r.paketti || r.unit_cents !== kappale || tuotteetSlugilla.get(r.slug)?.category !== maara.kategoria) return r;
      const alennettu = Math.round(r.unit_cents * (1 - porras.prosentti / 100));
      alennusSentteina += (r.unit_cents - alennettu) * r.quantity;
      return { ...r, unit_cents: alennettu, maaraalennus_prosentti: porras.prosentti };
    });
    vaihtoehdot.push({ rivit: uudet, alennusSentteina, prosentti: porras.prosentti, tyyppi: "maara", minKate: maara.minKatePerPaita * kelpaavat });
  }
  vaihtoehdot.sort((a, b) => b.alennusSentteina - a.alennusSentteina);

  let hylatty = null;
  for (const v of vaihtoehdot) {
    const osat = [];
    for (const r of v.rivit) {
      const tuote = tuotteetSlugilla.get(r.slug);
      if (!tuote) return ei("kulu");
      osat.push({ tuote, varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100 });
    }
    const kate = laskeTilauksenNettokate(osat, toimitusmaksu);
    if (!kate.tunnettu) return ei("kulu");
    if (kate.nettokate < 0 || kate.nettokate < Math.max(minKateEuroa, v.minKate ?? 0)) { hylatty = hylatty ?? kate.nettokate; continue; }
    return { rivit: v.rivit, alennus: v.alennusSentteina / 100, prosentti: v.prosentti, tyyppi: v.tyyppi, syy: null, nettokate: kate.nettokate };
  }
  return ei("kate", hylatty);
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

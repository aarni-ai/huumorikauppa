/**
 * "Usein ostetaan yhdessä" -suositukset (puhdas moduuli): ostoskori (src/lib/ostoskori.ts), tuotesivu ja
 * GET /api/products?suositukset=<slug> käyttävät samaa logiikkaa.
 */
import { ILMAINEN_TOIMITUS_RAJA } from "./vakiot.js";
import { heikoinKate } from "./kate.js";
import { teemaRunko, onPersonoitava } from "./paketit.js";
import { onLahjakortti } from "./lahjakortti.js";
import { onPiilotettu } from "./piilotetut.js";

const pyorista = (x) => Math.round(x * 100) / 100;

/** Variantti, jonka voi lisätä koriin ilman valintaa (vain yksi koko/väri-yhdistelmä). Muuten null. */
export function suoraLisays(product) {
  if (onPersonoitava(product)) return null;
  const avaimet = Object.keys(product?.variants?.variant_map || {});
  if (avaimet.length !== 1) return null;
  const [color, size] = avaimet[0].split("|");
  return { color: color || undefined, size: size || undefined };
}

/** Ilmaisen toimituksen puuttuva summa fyysisistä tuotteista (lahjakortit eivät kerrytä rajaa). */
export function puuttuvaSumma(items) {
  const summa = pyorista((items || []).filter((i) => !onLahjakortti(i)).reduce((s, i) => s + Number(i.product.price) * i.quantity, 0));
  const vainLahjakortteja = items.length > 0 && items.every((i) => onLahjakortti(i));
  return vainLahjakortteja || summa >= ILMAINEN_TOIMITUS_RAJA ? 0 : pyorista(ILMAINEN_TOIMITUS_RAJA - summa);
}

/**
 * 3-4 suositusta, jotka täyttävät ilmaisen toimituksen puuttuvan summan. Ehdokkaat: myynnissä olevat (ei piilotettuja
 * kategorioita, ei tunnetusti alle myynnin katerajan, ei personoitavia eikä lahjakortteja), ei jo korissa. Järjestys:
 * hinta lähellä puuttuvaa summaa (summan ylittävä parempi kuin vajaaksi jäävä), etusijalla sama teema, sitten sama
 * huumorityyppi tai kategoria kuin korin tuotteilla. Yksi tuote per teema.
 * @param items [{ product, quantity }]
 */
export function valitseSuositukset(items, tuotteet, maara = 4) {
  const puuttuu = puuttuvaSumma(items);
  const fyysiset = items.filter((i) => !onLahjakortti(i));
  const korissa = new Set(fyysiset.map((i) => i.product.id));
  const teemat = new Set(fyysiset.map((i) => teemaRunko(i.product.slug)));
  const kategoriat = new Set(fyysiset.map((i) => i.product.category));
  const huumori = new Set(fyysiset.map((i) => i.product.humor_type).filter(Boolean));
  const ehdokkaat = tuotteet.filter(
    (p) =>
      !korissa.has(p.id) &&
      p.is_active !== false &&
      !onPiilotettu(p.category) &&
      !onLahjakortti({ product: p }) &&
      !onPersonoitava(p) &&
      Number(p.price) > 0 &&
      heikoinKate(p).sallittu !== false,
  );
  const pisteet = (p) => {
    let s = 0;
    if (puuttuu > 0) s += p.price >= puuttuu ? p.price - puuttuu : (puuttuu - p.price) * 3;
    if (teemat.has(teemaRunko(p.slug))) s -= 15;
    if (p.humor_type && huumori.has(p.humor_type)) s -= 2;
    if (kategoriat.has(p.category)) s -= 3;
    return s;
  };
  const jarjestetty = ehdokkaat
    .map((p) => ({ p, s: pisteet(p) }))
    .sort((a, b) => a.s - b.s || a.p.slug.localeCompare(b.p.slug));
  const valitut = [];
  const kaytetytTeemat = new Set();
  for (const { p } of jarjestetty) {
    const teema = teemaRunko(p.slug);
    if (kaytetytTeemat.has(teema)) continue;
    kaytetytTeemat.add(teema);
    valitut.push({ product: p, suoraan: suoraLisays(p), samaTeema: teemat.has(teema) });
    if (valitut.length >= maara) break;
  }
  return valitut;
}

/** Tuotesivun "Usein ostetaan yhdessä": kuin kori, jossa on vain tämä tuote (saman teeman pari ensin). */
export function ostetaanYhdessa(tuote, tuotteet, maara = 4) {
  if (!tuote) return [];
  return valitseSuositukset([{ product: tuote, quantity: 1 }], tuotteet, maara);
}

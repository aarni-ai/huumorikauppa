/**
 * Ostoskorin laskenta selaimessa: ilmaisen toimituksen puuttuva summa, suositukset sen täyttämiseen ja
 * pakettialennuksen arvio. Samat vakiot ja säännöt kuin palvelimella (api/_lib/*), lopullinen hinta lasketaan
 * aina kassalla palvelimella.
 */
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "../../api/_lib/vakiot.js";
import { heikoinKate, paketinHeikoinKate } from "../../api/_lib/kate.js";
import { teemaRunko, onPersonoitava } from "../../api/_lib/paketit.js";
import { onLahjakortti } from "../../api/_lib/lahjakortti.js";
import PAKETIT from "../../api/_lib/paketit-data.js";
import { onPiilotettu } from "@/lib/hiddenCategories";
import type { CartItem, Product } from "@/types/product";

export { ILMAINEN_TOIMITUS_RAJA, TOIMITUS };

export interface Paketti {
  slug: string;
  nimi: string;
  teema: string;
  tuotteet: [string, string];
  alennus_prosentti: number;
  /** false: alennus pois käytöstä (kate alle 30 % generoitaessa, syy paketit-data.js:ssä). */
  kaytossa?: boolean;
}
export const PAKETTIMAARITYKSET = PAKETIT as Paketti[];

type Rivi = Pick<CartItem, "product" | "quantity">;

const pyorista = (x: number) => Math.round(x * 100) / 100;

/** Fyysisten tuotteiden summa (lahjakortit eivät kerrytä ilmaisen toimituksen rajaa). */
export function fyysinenSumma(items: Rivi[]): number {
  return pyorista(items.filter((i) => !onLahjakortti(i)).reduce((s, i) => s + i.product.price * i.quantity, 0));
}

export interface ToimitusTila {
  summa: number;
  puuttuu: number;
  ilmainen: boolean;
  toimitus: number;
  edistyminen: number;
  vainLahjakortteja: boolean;
}

export function toimitusTila(items: Rivi[]): ToimitusTila {
  const summa = fyysinenSumma(items);
  const vainLahjakortteja = items.length > 0 && items.every((i) => onLahjakortti(i));
  const ilmainen = vainLahjakortteja || summa >= ILMAINEN_TOIMITUS_RAJA;
  return {
    summa,
    puuttuu: ilmainen ? 0 : pyorista(ILMAINEN_TOIMITUS_RAJA - summa),
    ilmainen,
    toimitus: ilmainen || summa === 0 ? 0 : TOIMITUS,
    edistyminen: Math.min(100, (summa / ILMAINEN_TOIMITUS_RAJA) * 100),
    vainLahjakortteja,
  };
}

/** Variantti, jonka voi lisätä koriin ilman valintaa (vain yksi koko/väri-yhdistelmä). Muuten null. */
export function suoraLisays(product: Product): { size?: string; color?: string } | null {
  if (onPersonoitava(product)) return null;
  const avaimet = Object.keys(product.variants?.variant_map || {});
  if (avaimet.length !== 1) return null;
  const [color, size] = avaimet[0].split("|");
  return { color: color || undefined, size: size || undefined };
}

export interface Suositus {
  product: Product;
  suoraan: { size?: string; color?: string } | null;
  samaTeema: boolean;
}

/**
 * 3-4 suositusta, jotka täyttävät ilmaisen toimituksen puuttuvan summan. Ehdokkaat: myynnissä olevat (ei piilotettuja
 * kategorioita, ei tunnetusti alle 20 %:n katetta, ei personoitavia eikä lahjakortteja), ei jo korissa. Järjestys:
 * hinta lähellä puuttuvaa summaa (summan ylittävä parempi kuin vajaaksi jäävä), etusijalla sama teema, sitten sama
 * huumorityyppi tai kategoria kuin korin tuotteilla.
 */
export function valitseSuositukset(items: Rivi[], tuotteet: Product[], maara = 4): Suositus[] {
  const { puuttuu } = toimitusTila(items);
  const fyysiset = items.filter((i) => !onLahjakortti(i));
  const korissa = new Set(fyysiset.map((i) => i.product.id));
  const teemat = new Set(fyysiset.map((i) => teemaRunko(i.product.slug)));
  const kategoriat = new Set(fyysiset.map((i) => i.product.category));
  const huumori = new Set(fyysiset.map((i) => i.product.humor_type).filter(Boolean));
  const ehdokkaat = tuotteet.filter(
    (p) =>
      !korissa.has(p.id) &&
      !onPiilotettu(p.category) &&
      !onLahjakortti({ product: p }) &&
      !onPersonoitava(p) &&
      Number(p.price) > 0 &&
      heikoinKate(p).sallittu !== false,
  );
  const pisteet = (p: Product) => {
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
  const valitut: Suositus[] = [];
  const kaytetytTeemat = new Set<string>();
  for (const { p } of jarjestetty) {
    const teema = teemaRunko(p.slug);
    if (kaytetytTeemat.has(teema)) continue;
    kaytetytTeemat.add(teema);
    valitut.push({ product: p, suoraan: suoraLisays(p), samaTeema: teemat.has(teema) });
    if (valitut.length >= maara) break;
  }
  return valitut;
}

/** Paketin tuotteet ja hinnat. Alennus luvataan vain, jos jokainen varianttiyhdistelmä täyttää paketin 30 %:n katesäännön. */
export function paketinTiedot(paketti: Paketti, tuotteet: Product[]) {
  const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
  const osat = paketti.tuotteet.map((s) => bySlug.get(s)).filter(Boolean) as Product[];
  if (osat.length !== paketti.tuotteet.length) return null;
  const yhteensa = pyorista(osat.reduce((s, p) => s + p.price, 0));
  const alennusVoimassa = paketti.kaytossa !== false && paketinHeikoinKate(osat, paketti.alennus_prosentti).sallittu === true;
  return {
    paketti,
    tuotteet: osat,
    yhteensa,
    alennusVoimassa,
    pakettihinta: alennusVoimassa ? pyorista(yhteensa * (1 - paketti.alennus_prosentti / 100)) : yhteensa,
  };
}

/**
 * Arvio korin pakettialennuksesta (sama ehto kuin kassalla: molemmat tuotteet korissa, ei alennuskoodia, kate >= 30 %
 * kaikilla variaatioilla). Palvelin laskee lopullisen alennuksen.
 */
export function arvioiPakettialennus(items: Rivi[], tuotteet: Product[], alennuskoodi = false, paketit: Paketti[] = PAKETTIMAARITYKSET): number {
  if (alennuskoodi) return 0;
  const kpl = new Map<string, number>();
  for (const i of items) if (!onLahjakortti(i)) kpl.set(i.product.slug, (kpl.get(i.product.slug) || 0) + i.quantity);
  let alennus = 0;
  for (const paketti of paketit) {
    const [a, b] = paketti.tuotteet;
    const parit = Math.min(kpl.get(a) || 0, kpl.get(b) || 0);
    if (parit <= 0) continue;
    const t = paketinTiedot(paketti, tuotteet);
    if (!t?.alennusVoimassa) continue;
    alennus += parit * t.tuotteet.reduce((s, p) => s + (Math.round(p.price * 100) - Math.round(p.price * 100 * (1 - paketti.alennus_prosentti / 100))), 0);
    kpl.set(a, (kpl.get(a) || 0) - parit);
    kpl.set(b, (kpl.get(b) || 0) - parit);
  }
  return alennus / 100;
}

/**
 * Ostoskorin laskenta selaimessa: ilmaisen toimituksen puuttuva summa, suositukset sen täyttämiseen ja
 * pakettialennuksen arvio. Samat vakiot ja säännöt kuin palvelimella (api/_lib/*), lopullinen hinta lasketaan
 * aina kassalla palvelimella.
 */
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "../../api/_lib/vakiot.js";
import { paketinHeikoinKate } from "../../api/_lib/kate.js";
import { valitseSuositukset as valitseJs, ostetaanYhdessa as ostetaanYhdessaJs, suoraLisays as suoraLisaysJs } from "../../api/_lib/suositukset.js";
import { onLahjakortti } from "../../api/_lib/lahjakortti.js";
import PAKETIT from "../../api/_lib/paketit-data.js";
import { sovellaPaketit } from "../../api/_lib/paketit.js";
import { sovellaKorialennus, kalleinVariantti, KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, TPAITAPARI_KAMPANJA, tpaitapariVoimassa } from "../../api/_lib/korialennus.js";
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
type KoriRivi = Rivi & Pick<CartItem, "selectedSize" | "selectedColor">;

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

export interface Suositus {
  product: Product;
  suoraan: { size?: string; color?: string } | null;
  samaTeema: boolean;
}

/** Variantti, jonka voi lisätä koriin ilman valintaa (vain yksi koko/väri-yhdistelmä). Muuten null. */
export const suoraLisays = (product: Product): { size?: string; color?: string } | null => suoraLisaysJs(product);

/**
 * 3-4 suositusta, jotka täyttävät ilmaisen toimituksen puuttuvan summan (logiikka api/_lib/suositukset.js, sama kuin
 * /api/products?suositukset=<slug>).
 */
export const valitseSuositukset = (items: Rivi[], tuotteet: Product[], maara = 4): Suositus[] => valitseJs(items, tuotteet, maara);

/** Tuotesivun "Usein ostetaan yhdessä": saman teeman pari ensin, sitten ilmaisen toimituksen täyttävät. */
export const ostetaanYhdessa = (tuote: Product, tuotteet: Product[], maara = 4): Suositus[] => ostetaanYhdessaJs(tuote, tuotteet, maara);

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

export { KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL };

export interface KorialennusTila {
  /** Fyysisiä tuotteita korissa (kpl). */
  kpl: number;
  /** Montako tuotetta puuttuu alennuksesta (0, kun ehto täyttyy). */
  puuttuu: number;
  prosentti: number;
  /** Arvioitu alennus euroina (0, jos ei voimassa). */
  alennus: number;
  /** true: alennus on mukana arviossa. */
  voimassa: boolean;
  /** Voimassa olevan alennuksen tyyppi: "prosentti" (kahden tuotteen -X %) tai "tpaitapari" (kampanja). */
  tyyppi?: "prosentti" | "tpaitapari";
  /** T-paitaparikampanja voimassa: korissa on näin monta kampanjan t-paitaa (vihjettä "lisää toinen t-paita" varten). */
  kampanjaTpaitoja?: number;
  /** Miksi alennusta ei ole: null, "kpl", "pois", "koodi", "ei_rivia" (kaikki paketissa), "kulu", "kate" (katevahti). */
  syy: string | null;
}

/**
 * Kahden tuotteen alennuksen arvio korille: sama laskenta kuin kassalla (api/_lib/korialennus.js, pakettialennus
 * ensin). Rivin variantti valitun koon ja värin mukaan, muuten kallein variantti (varovainen arvio). Palvelin laskee
 * lopullisen alennuksen.
 */
/** Kampanjan t-paitojen määrä korissa, kun t-paitaparikampanja on voimassa; muuten 0. */
function kampanjanTpaitat(fyysiset: KoriRivi[]): number {
  if (!tpaitapariVoimassa()) return 0;
  return fyysiset
    .filter((i) => i.product.category === TPAITAPARI_KAMPANJA.kategoria && Math.abs(i.product.price - TPAITAPARI_KAMPANJA.kappalehinta) < 0.005)
    .reduce((s, i) => s + i.quantity, 0);
}

export function korialennusTila(items: KoriRivi[], tuotteet: Product[], alennuskoodi = false, paketit: Paketti[] = PAKETTIMAARITYKSET): KorialennusTila {
  const fyysiset = items.filter((i) => !onLahjakortti(i));
  const kpl = fyysiset.reduce((s, i) => s + i.quantity, 0);
  const pohja = { kpl, puuttuu: Math.max(0, KORIALENNUS_MIN_KPL - kpl), prosentti: KORIALENNUS_PROSENTTI, alennus: 0, voimassa: false };
  if (!(KORIALENNUS_PROSENTTI > 0)) return { ...pohja, syy: "pois" };
  if (alennuskoodi) return { ...pohja, syy: "koodi" };
  if (kpl < KORIALENNUS_MIN_KPL) return { ...pohja, syy: "kpl", kampanjaTpaitoja: kampanjanTpaitat(fyysiset) };
  const bySlug = new Map<string, Product>(tuotteet.map((p) => [p.slug, p]));
  for (const i of fyysiset) if (!bySlug.has(i.product.slug)) bySlug.set(i.product.slug, i.product);
  const rivit = fyysiset.map((i) => {
    const p = bySlug.get(i.product.slug) as Product;
    const kartta = (p.variants?.variant_map || {}) as Record<string, number>;
    const suora = kartta[`${(i.selectedColor || "").trim()}|${(i.selectedSize || "").trim()}`];
    return {
      slug: p.slug, quantity: i.quantity, unit_cents: Math.round(p.price * 100),
      variant_id: typeof suora === "number" ? suora : kalleinVariantti(p),
    };
  });
  const paketoitu = sovellaPaketit(rivit, bySlug, paketit).rivit;
  const k = sovellaKorialennus(paketoitu, bySlug, toimitusTila(items).toimitus);
  return { ...pohja, alennus: k.alennus, voimassa: k.alennus > 0, syy: k.syy, tyyppi: k.tyyppi, prosentti: k.tyyppi === "tpaitapari" ? 0 : pohja.prosentti, kampanjaTpaitoja: kampanjanTpaitat(fyysiset) };
}

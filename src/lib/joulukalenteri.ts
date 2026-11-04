/**
 * Joulukalenteri selaimessa (4.11.2026). Luukkujen tuotteet ja hinnat ovat vain palvelimella: sivu hakee tämän päivän
 * luukun rajapinnasta /api/products?joulukalenteri=1 (api/_lib/joulukalenteri-seuranta.js kalenterinJulkinenTila), joka ei
 * koskaan palauta tulevia luukkuja. Ostoskorin rivi muistaa luukun päivän (CartItem.luukku); päivän vaihtuessa rivi
 * palaa tavalliseen hintaan (src/hooks/use-cart.ts). Lopullisen hinnan laskee kassa (api/_lib/kassa.js).
 */
import { useQuery } from "@tanstack/react-query";
import type { CartItem, Product } from "@/types/product";
import { mapProduct } from "@/hooks/use-products";
import { lahetaKunLuokiteltu } from "./aitous";
import { helsinginPaiva } from "../../api/_lib/joulukalenteri.js";

export { JOULUKALENTERI_POLKU, LUUKKUJA, JOULUKALENTERI_ALKU, JOULUKALENTERI_LOPPU, JOULUKALENTERI_ESITTELY, luukunPvm, luukunTila, kalenterinTila, helsinginPaiva } from "../../api/_lib/joulukalenteri.js";

export type LuukunTila = "tuleva" | "auki" | "mennyt";

export interface AvoinLuukku {
  paiva: number;
  pvm: string;
  /** Luukun hinta perushinnalle (kpl > 1: koko sarjan hinta). */
  hinta: number;
  kpl: number;
  /** Perushinta nyt. */
  normaali: number;
  /** Alin hinta 30 päivän aikana ennen tarjousta (kuluttajansuojalaki 2:6 a §). */
  alin30: number | null;
  /** Myytävät koot ja niiden luukun kappalehinta. */
  koot: Record<string, number>;
  varit: string[] | null;
  product: Product;
}

export interface KalenterinTila {
  tanaan: string;
  tila: "tulossa" | "auki" | "paattynyt";
  alku: string;
  loppu: string;
  /** Vain menneet ja tämän päivän luukku. */
  luukut: { paiva: number; pvm: string; tila: LuukunTila }[];
  avoin: AvoinLuukku | null;
}

export async function haeKalenteri(): Promise<KalenterinTila> {
  const r = await fetch("/api/products?joulukalenteri=1");
  if (!r.ok) throw new Error(`Joulukalenterin haku epäonnistui (${r.status})`);
  const j = await r.json();
  return { ...j, avoin: j.avoin ? { ...j.avoin, product: mapProduct(j.avoin.product) } : null };
}

/** Kalenterin tila; haetaan uudelleen päivän vaihtuessa (avain = Suomen päivä). */
export function useJoulukalenteri(paiva: string, kaytossa = true) {
  return useQuery({ queryKey: ["joulukalenteri", paiva], queryFn: haeKalenteri, enabled: kaytossa, staleTime: 60_000 });
}

/** Ostoskorin rivin luukkumerkintä: luukun päivä ja tavallinen hinta (palautetaan päivän vaihtuessa). */
export interface KorinLuukku {
  pvm: string;
  normaali: number;
  /** Tavallisen hinnan koon mukaiset hinnat (product.variants.size_prices ennen luukkua). */
  kokohinnat?: Record<string, number> | null;
}

/** Onko rivin luukkuhinta voimassa hetkellä nyt (luukun oma päivä Suomen aikaa). */
export const luukkuVoimassa = (l: KorinLuukku | undefined, nyt: number = Date.now()): boolean => !!l && l.pvm === helsinginPaiva(nyt);

/** Korissa on rivi, jolla on tämän päivän luukun hinta (muut alennukset eivät yhdisty, api/_lib/kassa.js). */
export const luukkuKorissa = (items: Pick<CartItem, "luukku">[], nyt: number = Date.now()): boolean => items.some((i) => luukkuVoimassa(i.luukku, nyt));

/** Tuote luukun hinnalla korin arviota varten: kaikille koille luukun kappalehinta (koko -> hinta). */
export function luukkuTuote(product: Product, luukku: AvoinLuukku, koko?: string): { product: Product; merkki: KorinLuukku } {
  const hinta = (koko && luukku.koot[koko]) ?? Math.min(...Object.values(luukku.koot));
  const variants = { ...(product.variants || {}), size_prices: { ...luukku.koot } };
  return {
    product: { ...product, price: hinta, variants },
    merkki: { pvm: luukku.pvm, normaali: luukku.normaali, kokohinnat: product.variants?.size_prices ?? null },
  };
}

/** Vanhentunut luukkurivi takaisin tavalliseen hintaan. */
export function palautaTavallinen(item: CartItem, nyt: number = Date.now()): CartItem {
  if (!item.luukku || luukkuVoimassa(item.luukku, nyt)) return item;
  const { luukku, ...loput } = item;
  const variants = { ...(item.product.variants || {}) };
  if (luukku.kokohinnat) variants.size_prices = luukku.kokohinnat;
  else delete variants.size_prices;
  return { ...loput, product: { ...item.product, price: luukku.normaali, variants } };
}

export type JoulukalenteriTapahtuma = "kaynti" | "luukku" | "kori";
const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));
const kirjatut = new Set<string>();

/**
 * Mittaus (api/_lib/joulukalenteri-seuranta.js): käynti ja luukun avaus kerran sivulatausta kohden, koriin joka kerta.
 * Lähtee vasta, kun käynti on luokiteltu (src/lib/aitous.ts); palvelin kirjaa vain aidot.
 */
export function kirjaaJoulukalenteri(tapahtuma: JoulukalenteriTapahtuma): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti()) return;
  if (tapahtuma !== "kori") {
    if (kirjatut.has(tapahtuma)) return;
    kirjatut.add(tapahtuma);
  }
  lahetaKunLuokiteltu((aitous) => {
    fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ action: "joulukalenteri", tapahtuma, aitous }) }).catch(() => undefined);
  });
}

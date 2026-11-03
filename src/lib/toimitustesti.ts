/**
 * Ilmaisen toimituksen hintatesti selaimessa (4.11.2026). Säännöt ja hinnat: api/_lib/toimitustesti.js (sama koodi
 * kuin kassalla). Versio: src/lib/abTestit.ts (istuntoeväste hk_ab_toimitus). Lopullinen hinta lasketaan kassalla.
 *
 * Mittaus: käynti (versio arvottiin tällä käynnillä), tuotesivu (jokainen tuotesivun katselu), kori (lisäys koriin),
 * kassa (kassasivu, kerran sivulatausta kohden). Vain koostemäärät, ei tunnisteita; botit ohitetaan.
 */
import { abVersio, toimitusKayntiAlkoi } from "./abTestit";
import { koskee, sisaltavaHinta, alennusmyynnissa } from "../../api/_lib/toimitustesti.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { onLahjakortti } from "../../api/_lib/lahjakortti.js";
import { LISATUOTE_KATEGORIAT, ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "../../api/_lib/vakiot.js";
import type { CartItem, Product } from "@/types/product";

export type ToimitustestiTapahtuma = "kaynti" | "tuotesivu" | "kori" | "kassa";

export const toimitusVersio = (): "a" | "b" => abVersio("toimitus");
export const onToimitusB = (): boolean => toimitusVersio() === "b";

/**
 * Tuotesivun ja tuotekortin näytettävä hinta: B:ssä toimitus sisältyy (yhden tuotteen tilaus), muuten tuotteen hinta.
 * Lahjakortit, tarrat ja tuotteet, joiden hinta ylittää ilmaisen toimituksen rajan, näytetään aina perushinnalla.
 */
type HintaTuote = Pick<Product, "price" | "category" | "type" | "original_price">;

export function naytettavaHinta(product: HintaTuote, koko?: string | null, versio: "a" | "b" = toimitusVersio()): number {
  const perus = Number(rivinHinta(product, koko ?? null));
  if (versio !== "b" || product.type === "giftcard" || LISATUOTE_KATEGORIAT.includes(product.category) || alennusmyynnissa(product)) return perus;
  return koskee({ versio, toimitusKpl: 1, toimitus: perus >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS, alennus: false }) ? sisaltavaHinta(perus) : perus;
}

/** Sisältääkö näytettävä hinta toimituksen (B:n teksti "Ilmainen toimitus"). */
export const hintaSisaltaaToimituksen = (product: HintaTuote, koko?: string | null, versio: "a" | "b" = toimitusVersio()): boolean =>
  naytettavaHinta(product, koko, versio) !== Number(rivinHinta(product, koko ?? null));

export interface ToimitustestiKori {
  /** B:n hinta käytössä tässä korissa. */
  kaytossa: boolean;
  /** Tuotehinnan nousu euroina (toimitus + pyöristys), lisätään korin summaan; toimitus on silloin 0 €. */
  lisa: number;
  /** Koririvi, jonka hintaan toimitus sisältyy. */
  rivi: Pick<CartItem, "product" | "selectedSize"> | null;
}

/**
 * Kori B:ssä (sama sääntö kuin kassalla): yksi toimituksen kerryttävä kappale, A:n toimitusmaksu täysi (vakiot.js TOIMITUS) ja ei
 * alennuksia. toimitus = A:n toimitusmaksu (src/lib/ostoskori.ts toimitusTila), alennus = mikä tahansa alennus.
 */
export function toimitustestiKorissa(items: Pick<CartItem, "product" | "quantity" | "selectedSize">[], toimitus: number, alennus: boolean, versio: "a" | "b" = toimitusVersio()): ToimitustestiKori {
  const toimittavat = items.filter((i) => !onLahjakortti(i) && !LISATUOTE_KATEGORIAT.includes(i.product.category));
  const kpl = toimittavat.reduce((s, i) => s + i.quantity, 0);
  if (!koskee({ versio, toimitusKpl: kpl, toimitus, alennus })) return { kaytossa: false, lisa: 0, rivi: null };
  const r = toimittavat[0];
  if (alennusmyynnissa(r.product)) return { kaytossa: false, lisa: 0, rivi: null };
  const perus = Number(rivinHinta(r.product, r.selectedSize ?? null));
  return { kaytossa: true, lisa: Math.round((sisaltavaHinta(perus) - perus) * 100) / 100, rivi: r };
}

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));
const onTesti = () => typeof window !== "undefined" && (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;
let kassaKirjattu = false;

export function kirjaaToimitustesti(tapahtuma: ToimitustestiTapahtuma): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti() || onTesti()) return;
  if (window.location.pathname.startsWith("/hallinta")) return;
  if (tapahtuma === "kassa") {
    if (kassaKirjattu) return;
    kassaKirjattu = true;
  }
  fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ action: "toimitustesti", versio: toimitusVersio(), tapahtuma }) }).catch(() => undefined);
}

/** Sivun latauksessa (src/main.tsx): uusi käynti kirjataan, kun versio arvottiin tällä latauksella. */
export function aloitaToimitustesti(): void {
  if (typeof window === "undefined" || onBotti()) return;
  if (toimitusKayntiAlkoi()) kirjaaToimitustesti("kaynti");
}

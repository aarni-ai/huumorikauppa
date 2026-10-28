/**
 * Medialle-sivun kuvavalinta: sama logiikka sivulle (src/pages/MediaPage.tsx) ja zip-skriptille
 * (scripts/media-zip.mjs). Kuvat otetaan tuotteen oletusvärin variant_images-listasta.
 */
import type { Product } from "@/types/product";
import { MEDIA_KUVAKOKO } from "@/data/mediaKit";

export interface MediaKuva {
  /** Printifyn alkuperäinen osoite (camera_label mukana). */
  url: string;
  /** Painokelpoinen osoite (2048 px). */
  tulostusUrl: string;
  /** Tiedostonimen pääte ilman .jpg: "tuotekuva", "tunnelmakuva" tai "lisakuva". */
  tunnus: string;
  /** Näytettävä nimi. */
  nimi: string;
}

/** Tunnelmakuvan puuttuessa toinen kuva valitaan tässä järjestyksessä. */
const VARAKUVAT = ["folded", "front-collar-closeup", "back"];

export function cameraLabel(url: string): string | null {
  return /[?&]camera_label=([\w-]+)/.exec(url)?.[1] ?? null;
}

/** Lisää Printifyn mockup-osoitteeseen koon (&s=2048). */
export function tulostusUrl(url: string, koko: number = MEDIA_KUVAKOKO): string {
  return `${url}${url.includes("?") ? "&" : "?"}s=${koko}`;
}

/** Tuotteen oletusvärin kuvat. */
export function oletusvarinKuvat(product: Pick<Product, "variants" | "images">): string[] {
  const v = (product.variants ?? {}) as { default_color?: string; variant_images?: Record<string, string[]> };
  const byColor = v.variant_images ?? {};
  const color = v.default_color && byColor[v.default_color] ? v.default_color : Object.keys(byColor)[0];
  const list = (color && byColor[color]) || product.images || [];
  return list.filter(Boolean);
}

/**
 * Tuotekuva (front) ja tunnelmakuva (lifestyle). Jos tuotteella ei ole tunnelmakuvaa, toiseksi kuvaksi
 * valitaan taitettu, kauluskuva tai takakuva, ja se nimetään lisäkuvaksi. Puuttuvan kuvan kohta on null.
 */
export function mediaKuvat(product: Pick<Product, "variants" | "images">): { tuote: MediaKuva | null; toinen: MediaKuva | null } {
  const urls = oletusvarinKuvat(product);
  const find = (label: string) => urls.find((u) => cameraLabel(u) === label);
  const tee = (url: string | undefined, tunnus: string, nimi: string): MediaKuva | null =>
    url ? { url, tulostusUrl: tulostusUrl(url), tunnus, nimi } : null;
  const front = find("front");
  const lifestyle = find("lifestyle");
  if (lifestyle) return { tuote: tee(front, "tuotekuva", "Tuotekuva"), toinen: tee(lifestyle, "tunnelmakuva", "Tunnelmakuva") };
  const vara = VARAKUVAT.map(find).find(Boolean);
  return { tuote: tee(front, "tuotekuva", "Tuotekuva"), toinen: tee(vara, "lisakuva", "Lisäkuva") };
}

/** Slugilistasta aktiiviset tuotteet listan järjestyksessä. Puuttuvat slugit jäävät pois. */
export function valitseTuotteet<T extends { slug: string }>(slugs: string[], all: T[]): T[] {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is T => !!p);
}

/**
 * Tuotesivun ensimmäinen kuva lähikuvana painatuksesta (2.11.2026): vitsi luetaan heti puhelimen näytöltä. Lähikuva
 * on saman mockupin rajaus (api/img.js, parametri hk_lahi kuvan osoitteessa; api/_lib/lahikuva.js), joten se vaihtuu
 * värin mukana. Tuotteet: api/_lib/lahikuva-tuotteet.generated.js (50 suosituinta ja uudet mallit).
 */
import LAHIKUVA_TUOTTEET from "../../api/_lib/lahikuva-tuotteet.generated.js";

const PRINTIFY_MOCKUP = /^https:\/\/images-api\.printify\.com\/mockup\//;

export const onLahikuvaTuote = (slug?: string) => !!slug && (LAHIKUVA_TUOTTEET as Set<string>).has(slug);

/** Lähikuvan osoite mockupista: hk_lahi=paita|huppari. */
export function lahikuvanOsoite(mockup: string, huppari: boolean): string {
  return `${mockup}${mockup.includes("?") ? "&" : "?"}hk_lahi=${huppari ? "huppari" : "paita"}`;
}

/** Kuvalista, jonka alkuun lähikuva (vain lähikuvatuotteille ja Printify-mockupeille). */
export function lisaaLahikuva(product: { slug?: string; category?: string } | null | undefined, kuvat: string[]): string[] {
  const eka = kuvat[0];
  if (!product || !onLahikuvaTuote(product.slug) || !eka || !PRINTIFY_MOCKUP.test(eka) || eka.includes("hk_lahi=")) return kuvat;
  return [lahikuvanOsoite(eka, product.category === "hupparit" || /-huppari(-|$)/.test(product.slug || "")), ...kuvat];
}

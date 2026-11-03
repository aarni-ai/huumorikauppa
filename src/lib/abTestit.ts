/**
 * Laskeutumissivujen A/B-testit (3.11.2026, oma laskuri api/_lib/laskeutumiset.js ja api/_lib/tuoteseuranta.js).
 * Versio arvotaan sivulatauksessa ja pidetään vain muistissa (ei evästeitä eikä selaimen tallennusta), kuten etusivun
 * testi (src/lib/suppilo.ts).
 *   koko:  tuotesivu. a = koko valitaan itse, b = yleisin koko (L) esivalittu ja "Vaihda kokoa tarvittaessa".
 *   blogi: blogiartikkeli. a = nykyinen, b = artikkelin tuoteideat heti otsikon alla.
 * Pakotus testejä ja kuvakaappauksia varten: ?ab=koko-b tai ?ab=blogi-a osoitteessa.
 */
export type AbTesti = "koko" | "blogi";
const versiot: Partial<Record<AbTesti, "a" | "b">> = {};

function pakotettu(testi: AbTesti): "a" | "b" | null {
  if (typeof window === "undefined") return null;
  const m = new URLSearchParams(window.location.search).get("ab")?.match(/^(koko|blogi)-(a|b)$/);
  return m && m[1] === testi ? (m[2] as "a" | "b") : null;
}

export function abVersio(testi: AbTesti): "a" | "b" {
  if (!versiot[testi]) versiot[testi] = pakotettu(testi) ?? (Math.random() < 0.5 ? "a" : "b");
  return versiot[testi]!;
}

/** Laskeutumissivun testi polusta: tuotesivu -> koko, blogiartikkeli -> blogi, muut "". */
export function laskeutumisenAb(polku: string): string {
  if (/^\/tuote\/[^/]+/.test(polku)) return `koko-${abVersio("koko")}`;
  if (/^\/blogi\/[^/]+/.test(polku)) return `blogi-${abVersio("blogi")}`;
  return "";
}

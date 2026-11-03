/**
 * Laskeutumissivujen A/B-testit (3.11.2026, oma laskuri api/_lib/laskeutumiset.js ja api/_lib/tuoteseuranta.js).
 * Versio arvotaan sivulatauksessa ja pidetään vain muistissa (ei evästeitä eikä selaimen tallennusta), kuten etusivun
 * testi (src/lib/suppilo.ts).
 *   koko:  tuotesivu. a = koko valitaan itse, b = yleisin koko (L) esivalittu ja "Vaihda kokoa tarvittaessa".
 *   blogi: blogiartikkeli. a = nykyinen, b = artikkelin tuoteideat heti otsikon alla.
 *   toimitus: ilmaisen toimituksen hintatesti (4.11.2026, api/_lib/toimitustesti.js). a = hinta + toimitusmaksu,
 *          b = yhden tuotteen hinta sisältää toimituksen ("Ilmainen toimitus"). Hinnan on pysyttävä samana koko käynnin
 *          ajan, myös sivun uudelleenlatauksessa ja uudessa välilehdessä, joten versio on istuntoevästeessä
 *          hk_ab_toimitus (arvo vain "a" tai "b", ei tunnistetta, poistuu kun selain suljetaan; tietosuojaseloste).
 *          Botit, esirenderöinti ja testit saavat aina a:n.
 * Pakotus testejä ja kuvakaappauksia varten: ?ab=koko-b, ?ab=blogi-a tai ?ab=toimitus-b osoitteessa.
 */
export type AbTesti = "koko" | "blogi" | "toimitus";
const versiot: Partial<Record<AbTesti, "a" | "b">> = {};

export const TOIMITUS_EVASTE = "hk_ab_toimitus";
let toimitusUusi = false;

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));

function pakotettu(testi: AbTesti): "a" | "b" | null {
  if (typeof window === "undefined") return null;
  const m = new URLSearchParams(window.location.search).get("ab")?.match(/^(koko|blogi|toimitus)-(a|b)$/);
  return m && m[1] === testi ? (m[2] as "a" | "b") : null;
}

function lueEvaste(): "a" | "b" | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOIMITUS_EVASTE}=(a|b)(?:;|$)`));
    return m ? (m[1] as "a" | "b") : null;
  } catch {
    return null;
  }
}

function kirjoitaEvaste(v: "a" | "b") {
  try {
    const suojattu = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TOIMITUS_EVASTE}=${v}; path=/; SameSite=Lax${suojattu}`;
  } catch {
    /* evästeet estetty: versio pysyy sivulatauksen ajan */
  }
}

function toimitusVersioArvonta(): "a" | "b" {
  if (typeof window === "undefined" || typeof document === "undefined" || onBotti()) return "a";
  const p = pakotettu("toimitus");
  if (p) {
    if (lueEvaste() !== p) kirjoitaEvaste(p);
    return p;
  }
  const tallennettu = lueEvaste();
  if (tallennettu) return tallennettu;
  const v = Math.random() < 0.5 ? "a" : "b";
  kirjoitaEvaste(v);
  toimitusUusi = true;
  return v;
}

export function abVersio(testi: AbTesti): "a" | "b" {
  if (!versiot[testi]) versiot[testi] = testi === "toimitus" ? toimitusVersioArvonta() : pakotettu(testi) ?? (Math.random() < 0.5 ? "a" : "b");
  return versiot[testi]!;
}

/** Hintatesti: arvottiinko versio tällä sivulatauksella (uusi käynti). */
export const toimitusKayntiAlkoi = (): boolean => {
  abVersio("toimitus");
  return toimitusUusi;
};

/** Laskeutumissivun testi polusta: tuotesivu -> koko, blogiartikkeli -> blogi, muut "". */
export function laskeutumisenAb(polku: string): string {
  if (/^\/tuote\/[^/]+/.test(polku)) return `koko-${abVersio("koko")}`;
  if (/^\/blogi\/[^/]+/.test(polku)) return `blogi-${abVersio("blogi")}`;
  return "";
}

/** Testeille ja esirenderöinnille: kiinteä versio (null palauttaa arvonnan). */
export function asetaAbVersio(testi: AbTesti, versio: "a" | "b" | null): void {
  if (versio) versiot[testi] = versio;
  else delete versiot[testi];
}

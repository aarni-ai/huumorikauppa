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
 *   ensitilaus: "Ensimmäinen tilaus: −5 %" (5.11.2026, api/_lib/ensitilaus.js). a = ei merkkiä eikä alennusta, b = merkki
 *          tuotesivulla ja korissa sekä alennus kassalla ensimmäisestä tilauksesta. Istuntoeväste hk_ab_ensitilaus (arvo
 *          "a" tai "b"), riippumaton hintatestin evästeestä. Ennen alkupäivää (ENSITILAUSTESTI_ALKAEN) kaikki saavat a:n
 *          eikä evästettä kirjoiteta. Botit, esirenderöinti ja testit saavat aina a:n.
 * Pakotus testejä ja kuvakaappauksia varten: ?ab=koko-b, ?ab=blogi-a, ?ab=toimitus-b tai ?ab=ensitilaus-b osoitteessa.
 */
import { ENSITILAUSTESTI_ALKAEN } from "../../api/_lib/ensitilaus.js";

export type AbTesti = "koko" | "blogi" | "toimitus" | "ensitilaus";
const versiot: Partial<Record<AbTesti, "a" | "b">> = {};

export const TOIMITUS_EVASTE = "hk_ab_toimitus";
export const ENSITILAUS_EVASTE = "hk_ab_ensitilaus";
/** Evästeellä pidettävät testit (versio pysyy koko käynnin ajan, myös kassalla). */
const EVASTEET: Partial<Record<AbTesti, string>> = { toimitus: TOIMITUS_EVASTE, ensitilaus: ENSITILAUS_EVASTE };
/** Testit, joiden versio arvottiin tällä sivulatauksella (uusi käynti). */
const uudet: Partial<Record<AbTesti, boolean>> = {};

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));

function pakotettu(testi: AbTesti): "a" | "b" | null {
  if (typeof window === "undefined") return null;
  const m = new URLSearchParams(window.location.search).get("ab")?.match(/^(koko|blogi|toimitus|ensitilaus)-(a|b)$/);
  return m && m[1] === testi ? (m[2] as "a" | "b") : null;
}

function lueEvaste(nimi: string): "a" | "b" | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${nimi}=(a|b)(?:;|$)`));
    return m ? (m[1] as "a" | "b") : null;
  } catch {
    return null;
  }
}

function kirjoitaEvaste(nimi: string, v: "a" | "b") {
  try {
    const suojattu = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${nimi}=${v}; path=/; SameSite=Lax${suojattu}`;
  } catch {
    /* evästeet estetty: versio pysyy sivulatauksen ajan */
  }
}

/** Testi on alkanut (Helsingin päivä); vain ensitilaustestillä on alkupäivä. */
function alkanut(testi: AbTesti, nyt = new Date()): boolean {
  if (testi !== "ensitilaus") return true;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(nyt) >= ENSITILAUSTESTI_ALKAEN;
}

function evasteVersioArvonta(testi: AbTesti, nimi: string): "a" | "b" {
  if (typeof window === "undefined" || typeof document === "undefined" || onBotti()) return "a";
  const p = pakotettu(testi);
  if (p) {
    if (lueEvaste(nimi) !== p) kirjoitaEvaste(nimi, p);
    return p;
  }
  if (!alkanut(testi)) return "a";
  const tallennettu = lueEvaste(nimi);
  if (tallennettu) return tallennettu;
  const v = Math.random() < 0.5 ? "a" : "b";
  kirjoitaEvaste(nimi, v);
  uudet[testi] = true;
  return v;
}

export function abVersio(testi: AbTesti): "a" | "b" {
  if (!versiot[testi]) {
    const nimi = EVASTEET[testi];
    versiot[testi] = nimi ? evasteVersioArvonta(testi, nimi) : pakotettu(testi) ?? (Math.random() < 0.5 ? "a" : "b");
  }
  return versiot[testi]!;
}

/** Hintatesti: arvottiinko versio tällä sivulatauksella (uusi käynti). */
export const toimitusKayntiAlkoi = (): boolean => {
  abVersio("toimitus");
  return !!uudet.toimitus;
};

/** Ensitilaustesti: arvottiinko versio tällä sivulatauksella (uusi käynti). */
export const ensitilausKayntiAlkoi = (): boolean => {
  abVersio("ensitilaus");
  return !!uudet.ensitilaus;
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

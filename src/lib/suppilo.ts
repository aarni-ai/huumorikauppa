/**
 * Oma ostosuppilo (api/_lib/suppilo.js): kunkin vaiheen kirjaus kerran sivulatausta kohden, vain koostemäärä.
 * Ei evästeitä, ei selaimen tallennusta eikä tunnisteita (kuten käyntilaskuri src/lib/kaynti.ts).
 *
 * Etusivun A/B-testi: versio arvotaan sivulatauksessa ja pidetään vain muistissa. Se kulkee suppilon kirjauksissa ja
 * kassalla tilaukseen (orders.ab_versio), joten mittari vertaa versioita etusivun näytöistä ostoihin asti.
 */
/** Etusivun A/B-testin otsikot (2.11.2026; A = alkuperäinen). Tulos: /hallinta/mittarit, Ostosuppilo. */
export const AB_OTSIKOT = { a: "Löydä hauska lahja meiltä. Tilaa nyt.", b: "Hauskat paidat suomalaisella huumorilla." } as const;

import { lahetaKunLuokiteltu } from "./aitous";

export type Vaihe = "etusivu" | "tuotesivu" | "kori" | "kassa" | "maksu";

const kirjatut = new Set<Vaihe>();
let ab: "a" | "b" | "" = "";

/** A/B-versio tälle sivulataukselle (arvotaan ensimmäisellä kutsulla). */
export function abVersio(): "a" | "b" {
  if (!ab) ab = Math.random() < 0.5 ? "a" : "b";
  return ab;
}
/** Versio vain, jos kävijä on nähnyt etusivun testin (muuten tyhjä). */
export const nahtyVersio = () => (kirjatut.has("etusivu") ? ab : "");

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));

/** Selaintesti (scripts/suppilo-testi.mjs asettaa ennen sivun skriptejä): kirjaus versioon "testi", ei summiin. */
const onTesti = () => (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;

export function kirjaaVaihe(vaihe: Vaihe): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || kirjatut.has(vaihe) || onBotti()) return;
  if (window.location.pathname.startsWith("/hallinta")) return;
  kirjatut.add(vaihe);
  const versio = nahtyVersio();
  // Näyttövaiheet odottavat luokitusta (src/lib/aitous.ts); kori, kassa ja maksu tulevat klikkauksesta, joten ne lähtevät heti.
  lahetaKunLuokiteltu((aitous) => {
    fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ action: "suppilo", vaihe, ab: versio, aitous, ...(onTesti() ? { testi: true } : {}) }) }).catch(() => undefined);
  });
}

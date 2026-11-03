/**
 * Käynnin aitous (3.11.2026, api/_lib/botit.js): headless-merkit ja ihmisen vuorovaikutus koko sivulatauksen ajalta.
 * Vain luokka lähtee palvelimelle ("aito" | "headless" | "passiivinen"), ei tunnisteita eikä tallennusta selaimeen.
 *
 * Vuorovaikutus = selaimen tuottama (isTrusted) kosketus, hiiren liike tai painallus, rulla tai näppäin. Pelkkä
 * vieritystapahtuma ei riitä, koska ohjelmallinen vieritys (indeksoijat, ScrollToTop) tuottaa sen ilman ihmistä.
 */
export type Aitous = "aito" | "headless" | "passiivinen";

let vuorovaikutus = false;
let kuuntelee = false;
const jono: Array<(a: Aitous) => void> = [];

type Selain = {
  webdriver?: boolean; userAgent?: string; languages?: readonly string[]; plugins?: { length: number };
  outerWidth?: number; outerHeight?: number;
};

/** Headless-merkki tai null. Puhdas funktio testejä varten. */
export function headlessMerkki(s: Selain): string | null {
  const ua = s.userAgent || "";
  if (s.webdriver) return "webdriver";
  if (/HeadlessChrome|PhantomJS|Electron\/|jsdom|Cypress/i.test(ua)) return "ua";
  if (s.languages && s.languages.length === 0) return "kielet";
  if (s.outerWidth === 0 && s.outerHeight === 0) return "ikkuna";
  // Työpöydän Chrome/Edge listaa aina PDF-liitännäiset; headless ei listaa yhtään.
  const tyopoytaChrome = /Chrome\/\d/.test(ua) && !/Mobile|Android|CriOS/.test(ua);
  if (tyopoytaChrome && s.plugins && s.plugins.length === 0) return "liitannaiset";
  return null;
}

const selain = (): Selain => ({
  webdriver: navigator.webdriver, userAgent: navigator.userAgent, languages: navigator.languages,
  plugins: navigator.plugins, outerWidth: window.outerWidth, outerHeight: window.outerHeight,
});

export function aitousLuokka(): Aitous {
  if (typeof window === "undefined") return "passiivinen";
  if (headlessMerkki(selain())) return "headless";
  return vuorovaikutus ? "aito" : "passiivinen";
}

function purkaJono() {
  const a = aitousLuokka();
  while (jono.length) jono.shift()!(a);
}

const TAPAHTUMAT = ["pointerdown", "pointermove", "touchstart", "touchmove", "wheel", "keydown", "mousedown"] as const;

export function ihminen(e: Pick<Event, "isTrusted">) {
  if (!e.isTrusted || vuorovaikutus) return;
  vuorovaikutus = true;
  for (const t of TAPAHTUMAT) window.removeEventListener(t, ihminen, true);
  purkaJono();
}

/** Aloittaa vuorovaikutuksen seurannan (kerran sivulatausta kohden). */
export function seuraaVuorovaikutusta(): void {
  if (typeof window === "undefined" || kuuntelee) return;
  kuuntelee = true;
  for (const t of TAPAHTUMAT) window.addEventListener(t, ihminen, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") purkaJono(); });
  window.addEventListener("pagehide", purkaJono);
}

/**
 * Näyttöön perustuva kirjaus (käynti, suppilon etusivu/tuotesivu): lähtee heti, jos luokka on jo selvä (ihminen tai
 * headless), muuten ensimmäisestä vuorovaikutuksesta luokalla "aito" tai sivun piilotuksesta luokalla "passiivinen".
 * Palvelin kirjaa passiiviset ja headless-käynnit vain bottilaskuriin.
 */
export function lahetaKunLuokiteltu(laheta: (a: Aitous) => void): void {
  if (typeof window === "undefined") return;
  seuraaVuorovaikutusta();
  const a = aitousLuokka();
  if (a !== "passiivinen") { laheta(a); return; }
  jono.push(laheta);
}

/** Testeille. */
export function _nollaaAitous(): void {
  vuorovaikutus = false;
  jono.length = 0;
}

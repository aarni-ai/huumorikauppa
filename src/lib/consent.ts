/**
 * Evästesuostumus (Google Consent Mode v2).
 *
 * index.html asettaa ennen mitään Google-tagia oletuksen "kaikki kielletty" ja määrittelee
 * window.hkApplyConsent-funktion, joka päivittää suostumuksen ja lataa gtag.js:n vasta, kun
 * analytiikka on hyväksytty. Tämä moduuli tallentaa valinnan, kutsuu sitä ja kertoo muutoksista
 * muille komponenteille (Google Customer Reviews -merkki ja -kysely ladataan vain markkinointisuostumuksella).
 *
 * Tallennusmuoto avaimessa "huumorikauppa-cookies":
 *   {"v":2,"analytics":true,"marketing":false,"ts":"2026-10-26T..."}
 * Vanhat arvot: "accepted" (aiempi banneri mainitsi vain analytiikan) = analytiikka, "necessary" = ei mitään.
 */

export const CONSENT_KEY = "huumorikauppa-cookies";
export const CONSENT_CHANGED_EVENT = "hk:consent-changed";
export const OPEN_CONSENT_SETTINGS_EVENT = "hk:avaa-evasteasetukset";

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentWindow {
  hkApplyConsent?: (c: ConsentChoice) => void;
  gtag?: (...args: unknown[]) => void;
}

export function parseConsent(raw: string | null): ConsentChoice | null {
  if (!raw) return null;
  if (raw === "accepted") return { analytics: true, marketing: false };
  if (raw === "necessary") return { analytics: false, marketing: false };
  try {
    const c = JSON.parse(raw) as Partial<ConsentChoice>;
    if (c && typeof c === "object") return { analytics: c.analytics === true, marketing: c.marketing === true };
  } catch {
    /* rikkinäinen arvo: kysytään uudelleen */
  }
  return null;
}

/** Tallennettu valinta tai null, jos käyttäjä ei ole vielä valinnut. */
export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return getStoredConsent()?.marketing === true;
}

/** Poistaa Google Analyticsin evästeet (_ga, _ga_<id>, _gid) sivuston verkkotunnuksista. */
function deleteAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name || !/^(_ga|_gid|_gat|_gcl_)/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    }
  }
}

/** Tallentaa valinnan, päivittää Consent Moden ja lataa sallitut skriptit. */
export function saveConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  const previous = getStoredConsent();
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 2, ...choice, ts: new Date().toISOString() }));
  } catch {
    /* yksityinen ikkuna: valinta pätee tämän sivulatauksen ajan */
  }
  const w = window as unknown as ConsentWindow;
  if (typeof w.hkApplyConsent === "function") w.hkApplyConsent(choice);
  if (previous?.analytics && !choice.analytics) deleteAnalyticsCookies();
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_CHANGED_EVENT, { detail: choice }));
}

/** Avaa evästeasetukset (alatunnisteen "Evästeasetukset"-linkki). */
export function openConsentSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT));
}

/**
 * Suorittaa callbackin heti, jos markkinointisuostumus on annettu, muuten kun se annetaan.
 * Palauttaa siivousfunktion.
 */
export function onMarketingConsent(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (hasMarketingConsent()) {
    cb();
    return () => {};
  }
  const handler = (e: Event) => {
    if ((e as CustomEvent<ConsentChoice>).detail?.marketing) {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
      cb();
    }
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
}

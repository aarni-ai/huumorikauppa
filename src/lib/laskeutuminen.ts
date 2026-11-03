/**
 * Laskeutumisen kooste (3.11.2026, api/_lib/laskeutumiset.js): ulkopuolelta tulleesta käynnistä lähtee yksi kooste,
 * kun sivu suljetaan tai piilotetaan tai kun kävijä siirtyy sivuston sisällä toiselle sivulle. Mukana aika sivulla
 * (korina), jatkoiko kävijä, LCP-korina ja A/B-versio. Lähde, laite ja selain päätellään palvelimella. Ei evästeitä,
 * ei selaimen tallennusta eikä tunnisteita.
 */
import { kaynninTiedot } from "./kaynti";
import { laskeutumisenAb } from "./abTestit";

export const aikaKori = (s: number) => (s < 3 ? "0-3" : s < 10 ? "3-10" : s < 30 ? "10-30" : s < 60 ? "30-60" : "60+");
export const lcpKori = (ms: number) => (!ms ? "?" : ms <= 2500 ? "0-2.5" : ms <= 4000 ? "2.5-4" : "4+");

let tila: { runko: Record<string, unknown>; alku: number; lcp: number; lahetetty: boolean } | null = null;

function laheta(jatkoi: boolean) {
  const t = tila;
  if (!t || t.lahetetty) return;
  t.lahetetty = true;
  const body = { ...t.runko, action: "laskeutuminen", aika: aikaKori((performance.now() - t.alku) / 1000), jatkoi, lcp: lcpKori(t.lcp) };
  fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify(body) }).catch(() => undefined);
}

export function aloitaLaskeutuminen(): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  if (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || "")) return;
  // Taustavälilehti tai esilataus: kävijä ei näe sivua, joten aika ei kerro ensivaikutelmasta.
  if (document.visibilityState === "hidden") return;
  let navigointi: string | undefined;
  try { navigointi = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type; } catch { /* vanha selain */ }
  const tiedot = kaynninTiedot(window.location, document.referrer, navigointi);
  if (!tiedot) return;
  const bio = (window as unknown as { __hkBio?: { utm_source: string } }).__hkBio;
  const testi = (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;
  const { action: _pois, ...runko } = tiedot;
  tila = { runko: { ...runko, utm: tiedot.utm || bio?.utm_source || "", ab: laskeutumisenAb(window.location.pathname), ...(testi ? { testi: true } : {}) }, alku: 0, lcp: 0, lahetetty: false };
  try {
    new PerformanceObserver((l) => { const e = l.getEntries(); if (tila && e.length) tila.lcp = e[e.length - 1].startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* ei tukea */ }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") laheta(false); });
  window.addEventListener("pagehide", () => laheta(false));
}

/** Sivuston sisäinen siirtymä (src/components/ScrollToTop.tsx): kävijä jatkoi. */
export function merkitseSiirtyma(): void {
  laheta(true);
}

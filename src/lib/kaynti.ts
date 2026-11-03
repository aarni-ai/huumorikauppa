/**
 * Käyntilaskuri (api/_lib/kaynnit.js): kun sivu avataan sivuston ulkopuolelta (hakukone, some, suora osoite),
 * palvelimelle lähtee yksi kirjaus, jossa on vain saapumissivun polku, viittaavan sivun verkkotunnus ja
 * utm_source / ref. Ei evästeitä, ei selaimen tallennusta eikä tunnisteita, joten suostumusta ei tarvita.
 * Sisäiset siirtymät, uudelleenlataukset ja hallintasivut eivät ole käyntejä.
 */
import { lahetaKunLuokiteltu } from "./aitous";

export function kaynninTiedot(loc: { pathname: string; search: string; host: string }, viittaaja: string, navigointi?: string) {
  if (loc.pathname.startsWith("/hallinta")) return null;
  if (navigointi === "reload" || navigointi === "back_forward") return null;
  let host = "";
  try { host = viittaaja ? new URL(viittaaja).host.toLowerCase() : ""; } catch { host = ""; }
  const oma = (h: string) => h.replace(/^www\./, "");
  if (host && oma(host) === oma(loc.host.toLowerCase())) return null;
  const p = new URLSearchParams(loc.search);
  return { action: "kaynti", polku: loc.pathname, viittaaja: host, utm: p.get("utm_source") || "", ref: p.get("ref") || "", gclid: p.has("gclid") };
}

export function kirjaaKaynti(): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  if (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || "")) return;
  let navigointi: string | undefined;
  try { navigointi = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type; } catch { /* vanha selain */ }
  const tiedot = kaynninTiedot(window.location, document.referrer, navigointi);
  if (!tiedot) return;
  // Lyhyt bio-linkki (/ig, /tt, ...; index.html asettaa __hkBio): lähde ilman UTM-parametreja osoitteessa.
  const bio = (window as unknown as { __hkBio?: { utm_source: string } }).__hkBio;
  if (bio?.utm_source && !tiedot.utm) tiedot.utm = bio.utm_source;
  // Selaintesti (scripts/suppilo-testi.mjs): palvelin ohittaa testikäynnin (api/_lib/kaynnit.js onOmaTaiBotti).
  const testi = (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;
  // Lähtee vasta, kun käynti on luokiteltu (src/lib/aitous.ts): ihminen, headless tai passiivinen (bottilaskuriin).
  lahetaKunLuokiteltu((aitous) => {
    fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ ...tiedot, aitous, ...(testi ? { testi: true } : {}) }) }).catch(() => undefined);
  });
}

/**
 * Tuotesivun kevyt tapahtumaseuranta (2.11.2026, api/_lib/tuoteseuranta.js): yksi kooste tuotesivun katselua kohden,
 * kun sivu suljetaan, piilotetaan tai vaihdetaan toiseen tuotteeseen. Ei evästeitä, ei selaimen tallennusta eikä
 * tunnisteita (kuten oma suppilo src/lib/suppilo.ts). Botit ja testiselaimet ohitetaan.
 */
export type Tuotetapahtuma = "koko" | "vari" | "kokotaulukko" | "lisaa_nakyvissa" | "kori";

let nykyinen: { tapahtumat: Set<Tuotetapahtuma>; alku: number; syvin: number; lahetetty: boolean } | null = null;

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));
const onTesti = () => (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;

export const vierityskori = (osuus: number) => (osuus >= 0.98 ? "100" : osuus >= 0.75 ? "75" : osuus >= 0.5 ? "50" : osuus >= 0.25 ? "25" : null);
export const aikakori = (s: number) => (s < 10 ? "0-10" : s < 30 ? "10-30" : s < 60 ? "30-60" : s < 180 ? "60-180" : "180+");

function mittaaVieritys() {
  if (!nykyinen) return;
  const korkeus = Math.max(document.documentElement.scrollHeight, 1);
  nykyinen.syvin = Math.max(nykyinen.syvin, Math.min(1, (window.scrollY + window.innerHeight) / korkeus));
}

function laheta() {
  const n = nykyinen;
  if (!n || n.lahetetty) return;
  n.lahetetty = true;
  mittaaVieritys();
  const body = { action: "tuotetapahtumat", tapahtumat: [...n.tapahtumat], vieritys: vierityskori(n.syvin), aika: aikakori((Date.now() - n.alku) / 1000), ...(onTesti() ? { testi: true } : {}) };
  fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify(body) }).catch(() => undefined);
}

const piilossa = () => { if (document.visibilityState === "hidden") laheta(); };

/** Tuotesivun katselu alkaa; palauttaa lopetuksen (React-efektin siivous: lähettää koosteen). */
export function aloitaTuoteseuranta(): () => void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti()) return () => undefined;
  laheta();
  nykyinen = { tapahtumat: new Set(), alku: Date.now(), syvin: 0, lahetetty: false };
  mittaaVieritys();
  window.addEventListener("scroll", mittaaVieritys, { passive: true });
  document.addEventListener("visibilitychange", piilossa);
  window.addEventListener("pagehide", laheta);
  return () => {
    window.removeEventListener("scroll", mittaaVieritys);
    document.removeEventListener("visibilitychange", piilossa);
    window.removeEventListener("pagehide", laheta);
    laheta();
    nykyinen = null;
  };
}

export function kirjaaTuotetapahtuma(t: Tuotetapahtuma): void {
  nykyinen?.tapahtumat.add(t);
}

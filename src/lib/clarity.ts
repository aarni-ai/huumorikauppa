/**
 * Microsoft Clarity analytiikkasuostumuksen takana (2.11.2026). Skriptiä ei ladata, jos tunnistetta ei ole asetettu
 * (src/config/clarity.ts) tai kävijä ei ole hyväksynyt analytiikkaa. Suostumus samalla sivulatauksella lataa
 * skriptin heti. Hallintasivuilla Claritya ei ladata. Clarity saa suostumustiedon (consent API).
 */
import { clarityTunniste } from "@/config/clarity";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "./consent";

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
let ladattu = false;

export function lataaClarity(id = clarityTunniste()): boolean {
  if (ladattu || !id || typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.location.pathname.startsWith("/hallinta") || !hasAnalyticsConsent()) return false;
  ladattu = true;
  const w = window as unknown as { clarity?: ClarityFn };
  if (!w.clarity) {
    const f: ClarityFn = (...args: unknown[]) => { (f.q = f.q || []).push(args); };
    w.clarity = f;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  w.clarity("consent");
  return true;
}

/** Sovelluksen käynnistyksessä: lataa nyt tai kun analytiikkasuostumus annetaan. Ei mitään ilman tunnistetta. */
export function kaynnistaClarity(): void {
  if (typeof window === "undefined" || !clarityTunniste()) return;
  if (lataaClarity()) return;
  const kuuntelija = () => { if (lataaClarity()) window.removeEventListener(CONSENT_CHANGED_EVENT, kuuntelija); };
  window.addEventListener(CONSENT_CHANGED_EVENT, kuuntelija);
}

/** Testikäyttöön. */
export function _nollaaClarity() { ladattu = false; }

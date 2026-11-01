/**
 * Kumppanilinkin (?ref=<koodi>) talteenotto selaimessa (api/_lib/vakiot.js KUMPPANUUS). Linkin avaus kirjataan
 * kumppanin klikkauslaskuriin.
 * Koodi säilyy välilehden istunnon ajan (sessionStorage) vain markkinointisuostumuksella; ilman suostumusta se
 * pysyy muistissa sivulatauksen ajan. Kassa lähettää koodin palvelimelle, joka hyväksyy vain tunnetut koodit.
 */
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";
import { KUMPPANIKOODI } from "../../api/_lib/kumppani.js";
import { hasMarketingConsent } from "./consent";

const AVAIN = "huumorikauppa-kumppani";
let muistissa: string | null = null;

export function tallennaKumppaniUrlista(search: string): void {
  if (!KUMPPANUUS.kaytossa) return;
  const koodi = new URLSearchParams(search).get("ref")?.trim().toLowerCase();
  if (!koodi || !KUMPPANIKOODI.test(koodi)) return;
  const uusi = muistissa !== koodi;
  muistissa = koodi;
  try { if (hasMarketingConsent()) sessionStorage.setItem(AVAIN, koodi); } catch { /* ei tallennusta */ }
  // Klikkauslaskuri kumppanin raporttiin (api/sahkoposti.js "kumppaniklikki"): vain koodi, ei tunnisteita eikä evästeitä.
  if (uusi && typeof fetch === "function" && !/bot|crawl|spider|slurp|preview|headless/i.test(navigator.userAgent || "")) {
    fetch("/api/sahkoposti", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ action: "kumppaniklikki", koodi }),
    }).catch(() => undefined);
  }
}

/** Kumppanisivun (/k/<koodi>) eväste hk_kumppani, 30 päivää (api/sahkoposti.js ?kumppanisivu=). */
function evasteenKoodi(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)hk_kumppani=([^;]+)/);
  const k = m ? decodeURIComponent(m[1]).toLowerCase() : null;
  return k && KUMPPANIKOODI.test(k) ? k : null;
}

export function kumppani(): string | null {
  if (!KUMPPANUUS.kaytossa) return null;
  const evaste = evasteenKoodi();
  if (!muistissa && evaste) return evaste;
  if (muistissa) {
    // Suostumus voi tulla vasta linkin avaamisen jälkeen: tallennetaan silloin istuntoon (säilyy sivun latauksen yli).
    try { if (hasMarketingConsent() && !sessionStorage.getItem(AVAIN)) sessionStorage.setItem(AVAIN, muistissa); } catch { /* ei tallennusta */ }
    return muistissa;
  }
  try { return sessionStorage.getItem(AVAIN); } catch { return null; }
}

/** Selitys, kun kumppanikoodilla ei tule alennusta (api/checkout.js "kumppanikoodi" syy). */
export const kumppaniSelitys = (syy: string) => (syy === "muu_alennus"
  ? "Korin oma alennus on suurempi, joten se on käytössä koodin sijaan."
  : "Koodilla ei alennusta tähän tuotteeseen.");

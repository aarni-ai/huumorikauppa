/**
 * Kumppanilinkin (?ref=<koodi>) talteenotto selaimessa. Ohjelma on pois päältä (api/_lib/vakiot.js KUMPPANUUS).
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
  muistissa = koodi;
  try { if (hasMarketingConsent()) sessionStorage.setItem(AVAIN, koodi); } catch { /* ei tallennusta */ }
}

export function kumppani(): string | null {
  if (!KUMPPANUUS.kaytossa) return null;
  if (muistissa) return muistissa;
  try { return sessionStorage.getItem(AVAIN); } catch { return null; }
}

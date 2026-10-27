/**
 * Joulun viimeinen tilauspäivä. Yksi lähde bannerille, joulun lahjasivuille ja
 * /joulun-viimeiset-tilauspaivat-sivulle.
 *
 * Päivä lasketaan toteutuneista toimitusajoista (src/data/campaignSchedule.ts), enintään Printifyn
 * joulusesongin raja (seo/toimitusajat.md). Älä kirjoita päivämäärää tekstiin käsin.
 */
import { CHRISTMAS_ORDER_END_UTC_MS } from "./campaignSchedule";
import { JOULU_PAIVA_LYHYT, jouluLause } from "./tilauspaivat";

/**
 * Ihmiselle näytettävä lupaus (src/data/tilauspaivat.ts: päivä toimitusajoista, tilausajan jälkeen ilman päivää).
 * Arvioidaan sivun latauksessa ja buildissa.
 */
export const CHRISTMAS_DEADLINE_PROMISE = jouluLause();

/** Lyhyt muoto (banneri, otsikot). */
export const CHRISTMAS_DEADLINE_SHORT = JOULU_PAIVA_LYHYT;

export const CHRISTMAS_DEADLINE_PATH = "/joulun-viimeiset-tilauspaivat";

/**
 * Joulun tilausajan takaraja: 20.11.2026 klo 23.59.59 Suomen aikaa (= 21.59.59 UTC). Päivämäärä
 * on bannerin aikataulun kanssa samassa tiedostossa (src/data/campaignSchedule.ts).
 */
export const CHRISTMAS_DEADLINE_END_UTC_MS = CHRISTMAS_ORDER_END_UTC_MS;

/** Näytetäänkö joulun tilauspäivän banneri annettuna hetkenä. */
export function isBeforeChristmasDeadline(nowMs: number): boolean {
  return nowMs <= CHRISTMAS_DEADLINE_END_UTC_MS;
}

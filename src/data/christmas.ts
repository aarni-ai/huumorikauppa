/**
 * Joulun viimeinen tilauspäivä. Yksi lähde bannerille, joulun lahjasivuille ja
 * /joulun-viimeiset-tilauspaivat-sivulle.
 *
 * Päivä on johdettu Printifyn vuoden 2025 Eurooppa-cutoffeista miinus Suomen kuljetuspuskuri
 * (seo/toimitusajat.md). Sama päivä koskee kaikkia tuotteita, koska tuotekohtaista painotaloa ei
 * tiedetä. Älä lupaa missään muuta päivää.
 */
import { CHRISTMAS_ORDER_END_UTC_MS } from "./campaignSchedule";

/** Ihmiselle näytettävä lupaus sellaisenaan. */
export const CHRISTMAS_DEADLINE_PROMISE =
  "Tilaa viimeistään perjantaina 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä.";

/** Lyhyt muoto (banneri, otsikot). */
export const CHRISTMAS_DEADLINE_SHORT = "pe 20.11.2026";

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

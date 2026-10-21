/**
 * Joulun viimeinen tilauspäivä. Yksi lähde bannerille, joulun lahjasivuille ja
 * /joulun-viimeiset-tilauspaivat-sivulle.
 *
 * Päivä on johdettu Printifyn vuoden 2025 Eurooppa-cutoffeista miinus Suomen kuljetuspuskuri
 * (seo/toimitusajat.md). Sama päivä koskee kaikkia tuotteita, koska tuotekohtaista painotaloa ei
 * tiedetä. Älä lupaa missään muuta päivää.
 */

/** Ihmiselle näytettävä lupaus sellaisenaan. */
export const CHRISTMAS_DEADLINE_PROMISE =
  "Tilaa viimeistään perjantaina 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä.";

/** Lyhyt muoto (banneri, otsikot). */
export const CHRISTMAS_DEADLINE_SHORT = "pe 20.11.2026";

export const CHRISTMAS_DEADLINE_PATH = "/joulun-viimeiset-tilauspaivat";

/**
 * Bannerin näkyvyyden takaraja: 20.11.2026 klo 23.59.59 Suomen aikaa. Marraskuussa Suomessa on
 * normaaliaika (UTC+2), joten 23.59.59 paikallista aikaa = 21.59.59 UTC.
 */
export const CHRISTMAS_DEADLINE_END_UTC_MS = Date.UTC(2026, 10, 20, 21, 59, 59, 999);

/** Näytetäänkö joulun tilauspäivän banneri annettuna hetkenä. */
export function isBeforeChristmasDeadline(nowMs: number): boolean {
  return nowMs <= CHRISTMAS_DEADLINE_END_UTC_MS;
}

/**
 * Asiakkaalle näytettävät tilauspäivälauseet (isänpäivä ja joulu). Päivät lasketaan toteutuneista toimitusajoista
 * (src/data/campaignSchedule.ts). Lause valitaan hetken mukaan: kun viimeinen tilauspäivä on mennyt, päivämäärää ei
 * näytetä lainkaan. Moduulitason vakiot arvioidaan sivun latauksessa (selain) ja buildissa (esirenderöinti), joten
 * esirenderöity HTML päivittyy seuraavassa julkaisussa.
 */
import {
  CHRISTMAS_ORDER_END_UTC_MS,
  FATHERS_DAY_LAST_ORDER_TEXT,
  FATHERS_DAY_ORDER_END_UTC_MS,
  FATHERS_DAY_TEXT,
  JOULU_TILAUSPAIVA_ISO,
  paivaLyhyt,
  paivaTeksti,
} from "./campaignSchedule";
import { TOIMITUSAIKA_LAUSE } from "../config/toimitus";

export const isanpaivaAuki = (nowMs: number = Date.now()): boolean => nowMs <= FATHERS_DAY_ORDER_END_UTC_MS;
export const jouluAuki = (nowMs: number = Date.now()): boolean => nowMs <= CHRISTMAS_ORDER_END_UTC_MS;

/** "perjantaina 20.11.2026" */
export const JOULU_PAIVA_TEKSTI = paivaTeksti(JOULU_TILAUSPAIVA_ISO);
/** "pe 20.11.2026" */
export const JOULU_PAIVA_LYHYT = paivaLyhyt(JOULU_TILAUSPAIVA_ISO);

/** Joulun lupaus tai, tilausajan jälkeen, pelkkä toimitusaika. */
export function jouluLause(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? `Tilaa viimeistään ${JOULU_PAIVA_TEKSTI}, niin tilaus ehtii perille jouluaattoon mennessä.`
    : `Joulun tilausaika on päättynyt. ${TOIMITUSAIKA_LAUSE}`;
}

/** UKK "Ehtiikö jouluksi?" -vastauksen alku. */
export function jouluVastaus(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? `Ehtii, kun tilaat viimeistään ${JOULU_PAIVA_TEKSTI}. Silloin tilaus ehtii perille jouluaattoon mennessä.`
    : `Joulun tilausaika on päättynyt, eikä uusi tilaus enää ehdi perille jouluaattoon mennessä. ${TOIMITUSAIKA_LAUSE}`;
}

/** Isänpäivän lause tai, tilausajan jälkeen, lause ilman tilauspäivää. */
export function isanpaivaLause(nowMs: number = Date.now()): string {
  return isanpaivaAuki(nowMs)
    ? `Isänpäivä on ${FATHERS_DAY_TEXT}. Tilaa viimeistään ${FATHERS_DAY_LAST_ORDER_TEXT}, niin lahja ehtii perille isänpäiväksi.`
    : `Isänpäivä on ${FATHERS_DAY_TEXT}. Painettu lahja ei enää ehdi perille isänpäiväksi. ${TOIMITUSAIKA_LAUSE}`;
}

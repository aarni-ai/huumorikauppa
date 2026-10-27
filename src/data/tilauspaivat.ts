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
import { TOIMITUSAIKA_LAUSE, TOIMITUSAIKA_TEKSTI } from "../config/toimitus";

export const isanpaivaAuki = (nowMs: number = Date.now()): boolean => nowMs <= FATHERS_DAY_ORDER_END_UTC_MS;
export const jouluAuki = (nowMs: number = Date.now()): boolean => nowMs <= CHRISTMAS_ORDER_END_UTC_MS;

/** Joulun viimeinen tilauspäivä sijamuodossa (lasketaan, ei kirjoiteta käsin). */
export const JOULU_PAIVA_TEKSTI = paivaTeksti(JOULU_TILAUSPAIVA_ISO);
/** Joulun viimeinen tilauspäivä lyhyesti. */
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

/** Lyhyt joululause metakuvauksiin. Tilausajan jälkeen ilman päivämäärää. */
export function jouluMetaLause(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? `Tilaa viimeistään ${JOULU_PAIVA_LYHYT}, niin lahja ehtii jouluaattoon.`
    : `Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`;
}

/** Joulun tilausaikaoppaan metakuvaus. Tilausajan jälkeen ilman päivämäärää. */
export function jouluOpasMeta(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? `Joululahjat 2026: tilaa viimeistään ${JOULU_PAIVA_TEKSTI}, niin lupaamme toimituksen jouluaattoon. Näin suunnittelet tilauksen ja palautukset.`
    : "Joululahjat 2026: joulun tilausaika on päättynyt. Näin toimit, kun lahja ei enää ehdi jouluksi, ja miten palautukset hoituvat.";
}

/** Joulun tilausaikaoppaan ingressi. Tilausajan jälkeen ilman päivämäärää. */
export function jouluOpasIngressi(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? `Tilaa joululahjat viimeistään ${JOULU_PAIVA_TEKSTI}, niin lupaamme toimituksen jouluaattoon. Näin suunnittelet lahjat, koot ja palautukset ajoissa.`
    : "Joulun tilausaika on päättynyt. Näin toimit, kun lahja ei enää ehdi jouluksi, ja miten koot ja palautukset hoituvat.";
}

/** UKK-vastauksen jatko: päivän laskentaperuste, tilausajan jälkeen ilman päivämäärää. */
export function jouluLaskentaLause(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? "Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa, ja päivämäärä on laskettu hitaimman painotalon tuotanto- ja kuljetusajan mukaan. Myöhemmin tehdyille tilauksille emme lupaa toimitusta ennen joulua."
    : "Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa.";
}

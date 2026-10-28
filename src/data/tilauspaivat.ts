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
  JOULU_TOIMITUS_ARKIPAIVAA,
  joulunTilauspaivaTyypille,
  paivaLyhyt,
  paivaTeksti,
} from "./campaignSchedule.js";
import { TOIMITUSAIKA_LAUSE, TOIMITUSAIKA_TEKSTI } from "../config/toimitus.js";

export const isanpaivaAuki = (nowMs: number = Date.now()): boolean => nowMs <= FATHERS_DAY_ORDER_END_UTC_MS;
export const jouluAuki = (nowMs: number = Date.now()): boolean => nowMs <= CHRISTMAS_ORDER_END_UTC_MS;

/** Joulun viimeinen tilauspäivä sijamuodossa (lasketaan, ei kirjoiteta käsin). */
export const JOULU_PAIVA_TEKSTI = paivaTeksti(JOULU_TILAUSPAIVA_ISO);
/** Joulun viimeinen tilauspäivä lyhyesti. */
export const JOULU_PAIVA_LYHYT = paivaLyhyt(JOULU_TILAUSPAIVA_ISO);

/** T-paitojen oma (myöhäisempi) joulun tilauspäivä sijamuodossa. */
export const JOULU_TPAITA_PAIVA_TEKSTI = paivaTeksti(joulunTilauspaivaTyypille("t-paidat"));
/** Muiden tuotetyyppien joulun tilauspäivä sijamuodossa. */
export const JOULU_MUUT_PAIVA_TEKSTI = paivaTeksti(joulunTilauspaivaTyypille(null));

/** Ovatko t-paitojen ja muiden tuotteiden päivät eri päivinä (silloin lauseet kertovat molemmat). */
const KAKSI_PAIVAA = JOULU_TPAITA_PAIVA_TEKSTI !== JOULU_MUUT_PAIVA_TEKSTI;
const lyhyt = (iso: string) => paivaLyhyt(iso).replace(/\d{4}$/, "");

/**
 * Yläpalkin lyhyt muoto samasta lähteestä: t-paitojen ja muiden tuotteiden päivä viikonpäivineen ilman vuotta.
 * Tilausajan jälkeen tyhjä.
 */
export function jouluPalkkiLause(nowMs: number = Date.now()): string {
  if (!jouluAuki(nowMs)) return "";
  const t = lyhyt(joulunTilauspaivaTyypille("t-paidat"));
  const m = lyhyt(joulunTilauspaivaTyypille(null));
  return KAKSI_PAIVAA ? `tilaa t-paidat viimeistään ${t} ja muut tuotteet ${m}` : `tilaa viimeistään ${m}`;
}

/** Joulun lupaus tai, tilausajan jälkeen, pelkkä toimitusaika. */
export function jouluLause(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? KAKSI_PAIVAA
      ? `Tilaa t-paidat viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI} ja muut tuotteet viimeistään ${JOULU_MUUT_PAIVA_TEKSTI}, niin tilaus ehtii perille jouluaattoon mennessä.`
      : `Tilaa viimeistään ${JOULU_PAIVA_TEKSTI}, niin tilaus ehtii perille jouluaattoon mennessä.`
    : `Joulun tilausaika on päättynyt. ${TOIMITUSAIKA_LAUSE}`;
}

/** UKK "Ehtiikö jouluksi?" -vastauksen alku. */
export function jouluVastaus(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? KAKSI_PAIVAA
      ? `Ehtii, kun tilaat t-paidat viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI} ja muut tuotteet viimeistään ${JOULU_MUUT_PAIVA_TEKSTI}. Silloin tilaus ehtii perille jouluaattoon mennessä.`
      : `Ehtii, kun tilaat viimeistään ${JOULU_PAIVA_TEKSTI}. Silloin tilaus ehtii perille jouluaattoon mennessä.`
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
    ? `Jouluksi: tilaa viimeistään ${JOULU_PAIVA_LYHYT.replace(/\d{4}$/, "")}`
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
    ? `${jouluLause(nowMs).replace(", niin tilaus ehtii perille jouluaattoon mennessä.", ", niin lupaamme toimituksen jouluaattoon.")} Näin suunnittelet lahjat, koot ja palautukset ajoissa.`
    : "Joulun tilausaika on päättynyt. Näin toimit, kun lahja ei enää ehdi jouluksi, ja miten koot ja palautukset hoituvat.";
}

/** UKK-vastauksen jatko: päivän laskentaperuste, tilausajan jälkeen ilman päivämäärää. */
export function jouluLaskentaLause(nowMs: number = Date.now()): string {
  return jouluAuki(nowMs)
    ? "Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa. Päivämäärä on laskettu toteutuneista toimitusajoista Suomeen, ja tuotesivulla näkyy kunkin tuotteen oma päivä. Myöhemmin tehdyille tilauksille emme lupaa toimitusta ennen joulua."
    : "Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa.";
}

/** Tuotetyyppikohtaiset joulupäivät yhtenä lauseena. Tilausajan jälkeen ei mitään. */
export function jouluTyypitLause(nowMs: number = Date.now()): string {
  if (!Object.keys(JOULU_TOIMITUS_ARKIPAIVAA).length || !jouluAuki(nowMs)) return "";
  return `T-paidat ehtivät jouluksi, kun tilaat viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI}. Hupparit, julisteet, tarrat ja muut tuotteet ehtivät, kun tilaat viimeistään ${JOULU_MUUT_PAIVA_TEKSTI}.`;
}

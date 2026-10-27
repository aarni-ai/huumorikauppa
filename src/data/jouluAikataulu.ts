/**
 * Joulun viimeiset tilauspäivät tuotetyypeittäin (kategorian slug). Yksi lähde tuotesivun,
 * ostoskorin ja etusivun "Tilaa viimeistään X, niin ehtii jouluksi" -riville.
 *
 * Datalähde: scripts/joulu-aikataulu.mjs (Printifyn toteutuneet tilaukset 3-10/2026, 22 ei-peruutettua
 * tilausta, ajettu 26.10.2026). Pahin havaittu tuotanto (2) + kuljetus (13) + puskuri (2) = 17
 * arkipäivää ennen 23. joulukuuta antaa t-paidoille ja huppareille 30.11.2026, muille tyypeille
 * 11-16 arkipäivää eli vielä myöhemmän päivän; peitoista ei ole toimitusdataa. Havainnot ovat joulusesongin ulkopuolelta, ja tarroja lukuun ottamatta jokaisella tyypillä on tulostaja
 * ilman toimitusdataa, joten käytetään sivuston yhteistä joulun enimmäispäivää (Printifyn joulusesongin cutoffit,
 * seo/toimitusajat.md). Mikään päivä ei saa olla sitä myöhäisempi.
 * Testi varmistaa, ettei mikään päivä ylitä CHRISTMAS_ORDER_END_UTC_MS:ää.
 */
import { CHRISTMAS_ORDER_END_UTC_MS, JOULU_TILAUSPAIVA_ISO, helsinkiTimeToUtcMs } from "./campaignSchedule";

/** Viimeinen tilauspäivä (Suomen aikaa, päivän loppuun asti) kategorian slugin mukaan. */
export const JOULU_TILAUSPAIVAT: Readonly<Record<string, string>> = {
  "t-paidat": JOULU_TILAUSPAIVA_ISO,
  hupparit: JOULU_TILAUSPAIVA_ISO,
  pitkahihaiset: JOULU_TILAUSPAIVA_ISO,
  koristeet: JOULU_TILAUSPAIVA_ISO,
  peitot: JOULU_TILAUSPAIVA_ISO,
  seinataulut: JOULU_TILAUSPAIVA_ISO,
  tarrat: JOULU_TILAUSPAIVA_ISO,
  pipot: JOULU_TILAUSPAIVA_ISO,
  bodyt: JOULU_TILAUSPAIVA_ISO,
};

/** Kategoria, jota taulukossa ei ole, saa varhaisimman päivän (ei koskaan myöhäisempää). */
export const JOULU_OLETUS_PAIVA = Object.values(JOULU_TILAUSPAIVAT).sort()[0];

const WEEKDAYS = ["su", "ma", "ti", "ke", "to", "pe", "la"];

export interface JouluTakaraja {
  /** ISO-päivä, esim. "2026-11-20". */
  iso: string;
  /** Tilausaika päättyy (UTC ms, mukaan lukien): päivän 23.59.59.999 Suomen aikaa. */
  endUtcMs: number;
  /** Lyhyt muoto: viikonpäivän lyhenne ja päivämäärä. */
  text: string;
}

export function jouluTakaraja(iso: string): JouluTakaraja {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { iso, endUtcMs: helsinkiTimeToUtcMs(y, m, d, 23, 59, 59, 999), text: `${wd} ${d}.${m}.${y}` };
}

/** Kategorian takaraja (tuntematon kategoria: varhaisin päivä). */
export function jouluTakarajaKategorialle(category: string | null | undefined): JouluTakaraja {
  return jouluTakaraja((category && JOULU_TILAUSPAIVAT[category]) || JOULU_OLETUS_PAIVA);
}

/**
 * Näytettävä takaraja annetuille kategorioille: varhaisin niistä. null, jos kategorioita ei ole tai
 * varhaisin päivä on jo mennyt (silloin ei luvata mitään).
 */
export function aktiivinenJouluTakaraja(categories: readonly (string | null | undefined)[], nowMs: number): JouluTakaraja | null {
  if (categories.length === 0) return null;
  const earliest = categories.map(jouluTakarajaKategorialle).sort((a, b) => a.endUtcMs - b.endUtcMs)[0];
  return nowMs <= earliest.endUtcMs ? earliest : null;
}

/** Asiakkaalle näytettävä rivi. */
export function jouluRivi(t: JouluTakaraja): string {
  return `Tilaa viimeistään ${t.text}, niin ehtii jouluksi.`;
}

/** Myöhäisin taulukon päivä ei saa ylittää sivuston yhteistä lupausta (testattu). */
export const JOULU_MYOHAISIN_END_UTC_MS = Math.max(
  ...Object.values(JOULU_TILAUSPAIVAT).map((iso) => jouluTakaraja(iso).endUtcMs),
);
export const JOULU_SIVUSTON_END_UTC_MS = CHRISTMAS_ORDER_END_UTC_MS;

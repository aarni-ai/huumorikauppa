/**
 * Joulun viimeiset tilauspäivät tuotetyypeittäin (kategorian slug). Yksi lähde tuotesivun,
 * ostoskorin ja etusivun "Ehtii jouluksi, kun tilaat viimeistään X" -riville.
 *
 * Päivät lasketaan src/data/campaignSchedule.ts:n JOULU_TOIMITUS_ARKIPAIVAA-taulukosta (toteutuneiden toimitusten
 * 90. persentiili + 2 arkipäivää, ohuella datalla Printifyn ilmoittama toimitusaika). Laskelma: KASVU-RAPORTTI.md
 * 28.10.2026. Sivuston yhteinen päivä (banneri, UKK) on näistä varhaisin.
 */
import { CHRISTMAS_ORDER_END_UTC_MS, JOULU_TPAITA_PAINOTALOT, joulunTilauspaivaTyypille, helsinkiTimeToUtcMs } from "./campaignSchedule";
import { tuotepohja } from "../../api/_lib/materiaali.js";

/** Viimeinen tilauspäivä (Suomen aikaa, päivän loppuun asti) kategorian slugin mukaan. */
export const JOULU_TILAUSPAIVAT: Readonly<Record<string, string>> = Object.fromEntries(
  ["t-paidat", "hupparit", "pitkahihaiset", "koristeet", "peitot", "seinataulut", "tarrat", "pipot", "bodyt"].map((k) => [k, joulunTilauspaivaTyypille(k)]),
);

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

/**
 * Tuotteen takarajan avain painotalon mukaan: t-paita saa t-paitojen päivän vain, jos sen painotalo on laskelmassa
 * (JOULU_TPAITA_PAINOTALOT, painotalo api/_lib/tuotepohjat.generated.js). Muuten avain on tuntematon, ja päivä on
 * varhaisin.
 */
export function jouluAvain(product: { category?: string | null; slug?: string | null }): string | null {
  const category = product.category ?? null;
  if (category !== "t-paidat") return category;
  const painotalo = tuotepohja(product.slug)?.p;
  return painotalo != null && JOULU_TPAITA_PAINOTALOT.includes(painotalo) ? category : "t-paidat-muu-painotalo";
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
  return `Ehtii jouluksi, kun tilaat viimeistään ${t.text}.`;
}

/** Myöhäisin tuotetyyppikohtainen takaraja. */
export const JOULU_MYOHAISIN_END_UTC_MS = Math.max(
  ...Object.values(JOULU_TILAUSPAIVAT).map((iso) => jouluTakaraja(iso).endUtcMs),
);
export const JOULU_SIVUSTON_END_UTC_MS = CHRISTMAS_ORDER_END_UTC_MS;

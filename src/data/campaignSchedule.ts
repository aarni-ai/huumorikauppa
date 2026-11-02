/**
 * Kampanjapäivät ja sivuston yläbannerin aikataulu. KAIKKI bannerin päivämäärät ovat tässä
 * tiedostossa; banneri (src/components/SeasonalBanner.tsx) valitsee teeman pelkästään tästä
 * aikataulusta. Ajat ovat Suomen aikaa (Europe/Helsinki), ja ne muunnetaan UTC-millisekunneiksi
 * aikavyöhyketiedon avulla, joten kesä- ja normaaliaika menevät oikein.
 *
 * Importit ovat riippuvuudettomat api/_lib/vakiot.js (kampanjakalenterin päivät, sama lähde kuin kassalla) ja
 * src/config/toimitus.ts (toimitusajat), joten tiedostoa
 * voi edelleen käyttää mistä tahansa (christmas.ts, sivudata). Kampanjavaiheiden kokonaiskuva: src/data/kampanjat.ts.
 */
import { KAMPANJAPAIVAT } from "../../api/_lib/vakiot.js";
import { TOIMITUSAIKA_MAX_ARKIPAIVAA, TOIMITUSAIKA_OLETUS, TOIMITUSAJAT_TYYPEITTAIN } from "../config/toimitus";

const HELSINKI_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Helsinki",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Helsingin ajan ero UTC:hen (ms) annettuna UTC-hetkenä. */
function helsinkiOffsetMs(utcMs: number): number {
  const get = (type: string) =>
    Number(HELSINKI_PARTS.formatToParts(new Date(utcMs)).find((p) => p.type === type)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wall - Math.floor(utcMs / 1000) * 1000;
}

/** Suomen seinäkelloaika -> UTC-millisekunnit. Kuukausi 1-12. */
export function helsinkiTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  // Kaksi kierrosta: ensimmäinen arvio voi osua aikavyöhykkeen vaihdon väärälle puolelle.
  const guess = wall - helsinkiOffsetMs(wall);
  return wall - helsinkiOffsetMs(guess);
}

// ── Viimeiset tilauspäivät toteutuneista toimitusajoista ─────────────────────

/**
 * Pisin toimitusaika arkipäivinä (src/config/toimitus.ts TOIMITUSAIKA_MAX_ARKIPAIVAA, 2.11.2026: toteutuneet
 * Printify-tilaukset ja Printifyn toimitusaika Suomeen). Sama luku kuin sivuston "perillä 4-15 arkipäivässä".
 */
export const TOIMITUS_PAHIN_ARKIPAIVAA = TOIMITUSAIKA_MAX_ARKIPAIVAA;

/** Suomen arkipyhät 2026-2027 (lauantaipyhät mukana; laskenta ohittaa myös viikonloput). */
export const SUOMEN_PYHAT: ReadonlySet<string> = new Set([
  "2026-01-01", "2026-01-06", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-06-19", "2026-06-20",
  "2026-10-31", "2026-12-06", "2026-12-24", "2026-12-25", "2026-12-26", "2026-12-31",
  "2027-01-01", "2027-01-06", "2027-03-26", "2027-03-29", "2027-05-01", "2027-05-06", "2027-06-25", "2027-06-26",
  "2027-11-06", "2027-12-06", "2027-12-24", "2027-12-25", "2027-12-26", "2027-12-31",
]);

const lisaaPaivia = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const onArkipaiva = (iso: string): boolean => {
  const vp = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return vp !== 0 && vp !== 6 && !SUOMEN_PYHAT.has(iso);
};

/** Myöhäisin arkipäivä D, jolta D + n arkipäivää on viimeistään perillaIso (sama sääntö kuin joulu-aikataulu.mjs). */
export function viimeinenTilauspaiva(perillaIso: string, n: number = TOIMITUS_PAHIN_ARKIPAIVAA): string {
  let d = perillaIso;
  while (!onArkipaiva(d)) d = lisaaPaivia(d, -1);
  for (let jaljella = n; jaljella > 0; ) {
    d = lisaaPaivia(d, -1);
    if (onArkipaiva(d)) jaljella--;
  }
  while (!onArkipaiva(d)) d = lisaaPaivia(d, -1);
  return d;
}

const ESSIIVI = ["sunnuntaina", "maanantaina", "tiistaina", "keskiviikkona", "torstaina", "perjantaina", "lauantaina"];
const LYHYT = ["su", "ma", "ti", "ke", "to", "pe", "la"];
const osat = (iso: string) => iso.split("-").map(Number) as [number, number, number];
/** Muoto: viikonpäivä sijamuodossa ja päivämäärä pisteillä. */
export const paivaTeksti = (iso: string): string => {
  const [y, m, d] = osat(iso);
  return `${ESSIIVI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}.${m}.${y}`;
};
/** Muoto: viikonpäivän lyhenne ja päivämäärä. */
export const paivaLyhyt = (iso: string): string => {
  const [y, m, d] = osat(iso);
  return `${LYHYT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}.${m}.${y}`;
};
/** Päivän loppu 23.59.59.999 Suomen aikaa (UTC ms). */
export const paivanLoppuUtcMs = (iso: string): number => {
  const [y, m, d] = osat(iso);
  return helsinkiTimeToUtcMs(y, m, d, 23, 59, 59, 999);
};

// ── Isänpäivä 2026 ────────────────────────────────────────────────────────────

/** Isänpäivä 2026 (marraskuun toinen sunnuntai). */
export const FATHERS_DAY_TEXT = "sunnuntaina 8.11.2026";
/** Lahjan on oltava perillä viimeistään perjantaina ennen isänpäivää (lauantaijakelua ei oleteta). */
export const ISANPAIVA_PERILLA_ISO = "2026-11-06";
/** Viimeinen tilauspäivä isänpäiväksi toteutuneista toimitusajoista (TOIMITUS_PAHIN_ARKIPAIVAA). */
export const ISANPAIVA_TILAUSPAIVA_ISO = viimeinenTilauspaiva(ISANPAIVA_PERILLA_ISO);
export const FATHERS_DAY_LAST_ORDER_TEXT = paivaTeksti(ISANPAIVA_TILAUSPAIVA_ISO);
/** Isänpäivän tilausaika päättyy viimeisen tilauspäivän lopussa Suomen aikaa. */
export const FATHERS_DAY_ORDER_END_UTC_MS = paivanLoppuUtcMs(ISANPAIVA_TILAUSPAIVA_ISO);

// ── Joulu 2026 ────────────────────────────────────────────────────────────────

/** Joululahjan on oltava perillä viimeistään jouluaattoa edeltävänä päivänä. */
export const JOULU_PERILLA_ISO = "2026-12-23";
/**
 * Joulun toimitusaika arkipäivinä tuotetyypeittäin (kategorian slug): tuotetyypin toimitusajan yläraja
 * (src/config/toimitus.ts TOIMITUSAJAT_TYYPEITTAIN, 2.11.2026), perillä viimeistään JOULU_PERILLA_ISO. Samat luvut
 * kuin tuotesivun ja kassan "perillä X-Y arkipäivässä", joten tilauspäivä ja toimitusaika eivät voi olla ristiriidassa.
 * 2026: t-paidat ja hupparit 15 arkipäivää (päivä: src/test/kampanjat.test.ts).
 * Sivuston yhteinen päivä (banneri, kassa) on tyyppien varhaisin.
 */
export const JOULU_TOIMITUS_ARKIPAIVAA: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(TOIMITUSAJAT_TYYPEITTAIN).map(([k, [, max]]) => [k, max]),
);
/** Painotalot (Printify print_provider_id), joiden t-paidoille t-paitojen aika pätee: kaikki kaupan t-paitojen painotalot. */
export const JOULU_TPAITA_PAINOTALOT: readonly number[] = [30, 26, 99, 402];
export const JOULU_TOIMITUS_OLETUS_ARKIPAIVAA = TOIMITUSAIKA_OLETUS[1];
/** Tuotetyypin viimeinen tilauspäivä jouluksi (tuntematon tyyppi: oletusaika). */
export const joulunTilauspaivaTyypille = (kategoria?: string | null): string =>
  viimeinenTilauspaiva(JOULU_PERILLA_ISO, (kategoria && JOULU_TOIMITUS_ARKIPAIVAA[kategoria]) || JOULU_TOIMITUS_OLETUS_ARKIPAIVAA);
/** Sivuston yhteinen joulun tilauspäivä (banneri, UKK): tuotetyyppien varhaisin, jotta lupaus pätee kaikkiin. */
export const JOULU_TILAUSPAIVA_ISO = [joulunTilauspaivaTyypille(null), ...Object.keys(JOULU_TOIMITUS_ARKIPAIVAA).map(joulunTilauspaivaTyypille)].sort()[0];
/** Joulun tilausaika päättyy viimeisen tilauspäivän lopussa Suomen aikaa. */
export const CHRISTMAS_ORDER_END_UTC_MS = paivanLoppuUtcMs(JOULU_TILAUSPAIVA_ISO);

// ── Bannerin aikataulu ────────────────────────────────────────────────────────

export type BannerTheme = "isanpaiva" | "joulu" | "black-friday" | "joulu-tpaidat";

export interface BannerSlot {
  theme: BannerTheme;
  /** Ensimmäinen näyttöhetki (UTC ms, mukaan lukien). */
  fromMs: number;
  /** Viimeinen näyttöhetki (UTC ms, mukaan lukien). */
  untilMs: number;
}

/** T-paitojen (myöhäisin) joulun tilauspäivä ja sen loppu Suomen aikaa (2026: perjantai, src/test/kampanjat.test.ts). */
export const JOULU_TPAIDAT_ISO = joulunTilauspaivaTyypille("t-paidat");
export const JOULU_TPAIDAT_END_UTC_MS = paivanLoppuUtcMs(JOULU_TPAIDAT_ISO);
/** Päivän alku 00.00 Suomen aikaa (UTC ms). */
export const paivanAlkuUtcMs = (iso: string): number => {
  const [y, m, d] = osat(iso);
  return helsinkiTimeToUtcMs(y, m, d);
};
/** Black Friday -viikko (kampanjakalenteri, api/_lib/vakiot.js KAMPANJAPAIVAT; sama päivä kassalla). */
export const BLACK_FRIDAY_ALKU_UTC_MS = paivanAlkuUtcMs(KAMPANJAPAIVAT.blackFriday.alku);
export const BLACK_FRIDAY_LOPPU_UTC_MS = paivanLoppuUtcMs(KAMPANJAPAIVAT.blackFriday.loppu);

/**
 * Järjestyksessä, ei päällekkäisyyksiä. Isänpäivän banneri 1.10. alkaen isänpäivän viimeisen tilauspäivän loppuun,
 * joulun banneri heti sen jälkeen, Black Friday -viikolla Black Friday, sitten joulu sivuston joulun tilauspäivän
 * (hupparit ja muut) loppuun ja t-paitojen tilauspäivän (JOULU_TPAIDAT_ISO) loppuun t-paitojen banneri. Sen jälkeen
 * lahjakortti (SeasonalBanner, vain kun lahjakortit ovat myynnissä). Päivät lasketaan toimitusajoista (yllä), joten
 * vanhentunutta päivää ei näytetä koskaan.
 */
const SLOTIT: BannerSlot[] = [
  {
    theme: "isanpaiva",
    fromMs: helsinkiTimeToUtcMs(2026, 10, 1),
    untilMs: FATHERS_DAY_ORDER_END_UTC_MS,
  },
  {
    theme: "joulu",
    fromMs: Math.max(FATHERS_DAY_ORDER_END_UTC_MS + 1, helsinkiTimeToUtcMs(2026, 10, 1)),
    untilMs: Math.min(CHRISTMAS_ORDER_END_UTC_MS, BLACK_FRIDAY_ALKU_UTC_MS - 1),
  },
  {
    theme: "black-friday",
    fromMs: BLACK_FRIDAY_ALKU_UTC_MS,
    untilMs: BLACK_FRIDAY_LOPPU_UTC_MS,
  },
  {
    theme: "joulu",
    fromMs: BLACK_FRIDAY_LOPPU_UTC_MS + 1,
    untilMs: CHRISTMAS_ORDER_END_UTC_MS,
  },
  {
    theme: "joulu-tpaidat",
    fromMs: CHRISTMAS_ORDER_END_UTC_MS + 1,
    untilMs: JOULU_TPAIDAT_END_UTC_MS,
  },
];
export const BANNER_SCHEDULE: readonly BannerSlot[] = SLOTIT.filter((s) => s.untilMs >= s.fromMs);

/** Annettuna hetkenä näytettävä bannerin teema, tai null. */
export function activeBannerTheme(nowMs: number, schedule: readonly BannerSlot[] = BANNER_SCHEDULE): BannerTheme | null {
  return schedule.find((s) => nowMs >= s.fromMs && nowMs <= s.untilMs)?.theme ?? null;
}

/** Seuraava hetki, jolloin bannerin teema vaihtuu (tai null, jos ei enää vaihdu). */
export function nextBannerChangeMs(nowMs: number, schedule: readonly BannerSlot[] = BANNER_SCHEDULE): number | null {
  const edges = schedule.flatMap((s) => [s.fromMs, s.untilMs + 1]).filter((t) => t > nowMs);
  return edges.length > 0 ? Math.min(...edges) : null;
}

/**
 * Kampanjapäivät ja sivuston yläbannerin aikataulu. KAIKKI bannerin päivämäärät ovat tässä
 * tiedostossa; banneri (src/components/SeasonalBanner.tsx) valitsee teeman pelkästään tästä
 * aikataulusta. Ajat ovat Suomen aikaa (Europe/Helsinki), ja ne muunnetaan UTC-millisekunneiksi
 * aikavyöhyketiedon avulla, joten kesä- ja normaaliaika menevät oikein.
 *
 * Tiedostolla ei ole importteja, jotta sitä voi käyttää mistä tahansa (christmas.ts, sivudata).
 */

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

// ── Isänpäivä 2026 ────────────────────────────────────────────────────────────

/** Isänpäivä 2026 (marraskuun toinen sunnuntai). */
export const FATHERS_DAY_TEXT = "sunnuntaina 8.11.2026";
/** Viimeinen tilauspäivä isänpäiväksi (omistajan päätös). */
export const FATHERS_DAY_LAST_ORDER_TEXT = "keskiviikkona 28.10.2026";
/** Isänpäivän tilausaikaa on jäljellä 28.10.2026 klo 23.59.59 asti Suomen aikaa. */
export const FATHERS_DAY_ORDER_END_UTC_MS = helsinkiTimeToUtcMs(2026, 10, 28, 23, 59, 59, 999);

// ── Joulu 2026 ────────────────────────────────────────────────────────────────

/** Joulun viimeinen tilauspäivä pe 20.11.2026 klo 23.59.59 Suomen aikaa (teksti: christmas.ts). */
export const CHRISTMAS_ORDER_END_UTC_MS = helsinkiTimeToUtcMs(2026, 11, 20, 23, 59, 59, 999);

// ── Bannerin aikataulu ────────────────────────────────────────────────────────

export type BannerTheme = "isanpaiva" | "joulu";

export interface BannerSlot {
  theme: BannerTheme;
  /** Ensimmäinen näyttöhetki (UTC ms, mukaan lukien). */
  fromMs: number;
  /** Viimeinen näyttöhetki (UTC ms, mukaan lukien). */
  untilMs: number;
}

/**
 * Järjestyksessä, ei päällekkäisyyksiä. Isänpäivän banneri 1.10.2026 alkaen 28.10.2026 loppuun,
 * sitten joulun banneri 29.10.2026 klo 00.00 alkaen 20.11.2026 loppuun. Sen jälkeen ei banneria.
 */
export const BANNER_SCHEDULE: readonly BannerSlot[] = [
  {
    theme: "isanpaiva",
    fromMs: helsinkiTimeToUtcMs(2026, 10, 1),
    untilMs: FATHERS_DAY_ORDER_END_UTC_MS,
  },
  {
    theme: "joulu",
    fromMs: helsinkiTimeToUtcMs(2026, 10, 29),
    untilMs: CHRISTMAS_ORDER_END_UTC_MS,
  },
];

/** Annettuna hetkenä näytettävä bannerin teema, tai null. */
export function activeBannerTheme(nowMs: number, schedule: readonly BannerSlot[] = BANNER_SCHEDULE): BannerTheme | null {
  return schedule.find((s) => nowMs >= s.fromMs && nowMs <= s.untilMs)?.theme ?? null;
}

/** Seuraava hetki, jolloin bannerin teema vaihtuu (tai null, jos ei enää vaihdu). */
export function nextBannerChangeMs(nowMs: number, schedule: readonly BannerSlot[] = BANNER_SCHEDULE): number | null {
  const edges = schedule.flatMap((s) => [s.fromMs, s.untilMs + 1]).filter((t) => t > nowMs);
  return edges.length > 0 ? Math.min(...edges) : null;
}

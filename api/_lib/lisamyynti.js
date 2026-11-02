/**
 * Ostoskorin lisämyynnin seuranta (2.11.2026, src/lib/lisamyynti.ts): koostemäärä päivä x tapahtuma, ei evästeitä eikä
 * tunnisteita (kuten api/_lib/tuoteseuranta.js). Botit ja oma liikenne ohitetaan (api/sahkoposti.js omaTaiBotti).
 *
 * Tapahtumat:
 *   suositukset_naytetty    korissa näytettiin suositukset (kerran korinäkymää kohden)
 *   suositus_lisatty        suositus lisättiin koriin
 *   toinen_paita_naytetty   "Lisää toinen paita, niin toimitus on ilmainen" näytettiin
 *   toinen_paita_lisatty    ehdotettu toinen paita lisättiin koriin
 */
export const LISAMYYNTI_TAPAHTUMAT = ["suositukset_naytetty", "suositus_lisatty", "toinen_paita_naytetty", "toinen_paita_lisatty"];

export async function varmistaLisamyynti(db) {
  await db`create table if not exists lisamyynti_seuranta (paiva date not null, tapahtuma text not null, n integer not null default 0,
    primary key (paiva, tapahtuma))`;
}

export async function kirjaaLisamyynti(db, tapahtuma) {
  if (!LISAMYYNTI_TAPAHTUMAT.includes(tapahtuma)) return false;
  await varmistaLisamyynti(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into lisamyynti_seuranta (paiva, tapahtuma, n) values (${paiva}::date, ${tapahtuma}, 1)
    on conflict (paiva, tapahtuma) do update set n = lisamyynti_seuranta.n + 1`;
  return true;
}

const pros = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

/** Rivit { tapahtuma, n } -> määrät ja lisäysprosentit. */
export function koostaLisamyynti(rivit) {
  const n = Object.fromEntries(LISAMYYNTI_TAPAHTUMAT.map((t) => [t, 0]));
  for (const r of rivit) if (r.tapahtuma in n) n[r.tapahtuma] += Number(r.n) || 0;
  return {
    ...n,
    suositusOsuus: pros(n.suositus_lisatty, n.suositukset_naytetty),
    toinenPaitaOsuus: pros(n.toinen_paita_lisatty, n.toinen_paita_naytetty),
  };
}

export async function lisamyyntiValilla(db, alku, loppu) {
  await varmistaLisamyynti(db);
  const rivit = await db`select tapahtuma, sum(n)::int as n from lisamyynti_seuranta where paiva between ${alku}::date and ${loppu}::date group by 1`;
  return { alku, loppu, ...koostaLisamyynti(rivit) };
}

/** Mittarin ja päivän yhteenvedon rivi. */
export function lisamyyntiRivi(s) {
  return `Korin lisämyynti ${s.alku}–${s.loppu}: suositukset näytetty ${s.suositukset_naytetty}, lisätty ${s.suositus_lisatty}` +
    `${s.suositusOsuus != null ? ` (${String(s.suositusOsuus).replace(".", ",")} %)` : ""}; toinen paita näytetty ${s.toinen_paita_naytetty}, lisätty ${s.toinen_paita_lisatty}` +
    `${s.toinenPaitaOsuus != null ? ` (${String(s.toinenPaitaOsuus).replace(".", ",")} %)` : ""}.`;
}

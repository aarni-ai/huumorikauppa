/**
 * Toimitusarvio arkipäivinä (ei viikonloppuja eikä Suomen arkipyhiä). Päivät käsitellään kalenteripäivinä
 * muodossa "YYYY-MM-DD" (UTC-laskenta), jotta selaimen aikavyöhyke ei siirrä päivää.
 *
 * Käyttö: tuotesivun "Toimitusarvio: perillä viimeistään <päivä>" ja "Ehtii jouluksi" -merkki, sekä
 * joulunViimeisetTilauspaivat() muille sivuille (esim. joululahjasivu).
 */
import { JOULU_VIIMEINEN_TILAUSPAIVA, TOIMITUSPROFIILIT, OLETUSALUE, JOULU_RAJA, JOULUSESONKI_ALKAA, type ToimitusAlue, type ToimitusProfiili } from "@/config/toimitusajat";

export type Paiva = string; // "YYYY-MM-DD"

const DAY = 86400000;
const pvm = (s: Paiva) => new Date(`${s}T00:00:00Z`);
const muoto = (d: Date): Paiva => d.toISOString().slice(0, 10);
export const lisaaPaivia = (s: Paiva, n: number): Paiva => muoto(new Date(pvm(s).getTime() + n * DAY));

/** Pääsiäispäivä (gregoriaaninen, anonyymi algoritmi). */
export function paasiainen(vuosi: number): Paiva {
  const a = vuosi % 19;
  const b = Math.floor(vuosi / 100);
  const c = vuosi % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const kk = Math.floor((h + l - 7 * m + 114) / 31);
  const pv = ((h + l - 7 * m + 114) % 31) + 1;
  return `${vuosi}-${String(kk).padStart(2, "0")}-${String(pv).padStart(2, "0")}`;
}

/** Ensimmäinen viikonpäivä (0 = su ... 6 = la) annetulta päivältä alkaen. */
function ensimmainenViikonpaiva(alku: Paiva, viikonpaiva: number): Paiva {
  const d = pvm(alku);
  return lisaaPaivia(alku, (viikonpaiva - d.getUTCDay() + 7) % 7);
}

const pyhaValimuisti = new Map<number, Set<Paiva>>();

/**
 * Suomen pyhäpäivät ja arkipyhät, joina posti ja painotalot eivät toimita: uudenvuodenpäivä, loppiainen,
 * pitkäperjantai, 2. pääsiäispäivä, vappu, helatorstai, juhannusaatto ja -päivä, pyhäinpäivä, itsenäisyyspäivä,
 * jouluaatto, joulupäivä ja tapaninpäivä.
 */
export function suomenPyhat(vuosi: number): Set<Paiva> {
  const v = pyhaValimuisti.get(vuosi);
  if (v) return v;
  const p = paasiainen(vuosi);
  const juhannusaatto = ensimmainenViikonpaiva(`${vuosi}-06-19`, 5);
  const pyhat = new Set<Paiva>([
    `${vuosi}-01-01`,
    `${vuosi}-01-06`,
    lisaaPaivia(p, -2),
    p,
    lisaaPaivia(p, 1),
    `${vuosi}-05-01`,
    lisaaPaivia(p, 39),
    juhannusaatto,
    lisaaPaivia(juhannusaatto, 1),
    ensimmainenViikonpaiva(`${vuosi}-10-31`, 6),
    `${vuosi}-12-06`,
    `${vuosi}-12-24`,
    `${vuosi}-12-25`,
    `${vuosi}-12-26`,
  ]);
  pyhaValimuisti.set(vuosi, pyhat);
  return pyhat;
}

export function onArkipaiva(s: Paiva): boolean {
  const vp = pvm(s).getUTCDay();
  if (vp === 0 || vp === 6) return false;
  return !suomenPyhat(Number(s.slice(0, 4))).has(s);
}

/** Päivä, joka on n arkipäivää annetun päivän jälkeen (annettu päivä ei lasketa). */
export function lisaaArkipaivia(alku: Paiva, n: number): Paiva {
  let s = alku;
  let jaljella = n;
  while (jaljella > 0) {
    s = lisaaPaivia(s, 1);
    if (onArkipaiva(s)) jaljella--;
  }
  return s;
}

/** Tämän päivän päivämäärä Suomen ajassa. */
export function tanaanSuomessa(nyt: Date = new Date()): Paiva {
  const o = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(nyt)
      .map((x) => [x.type, x.value]),
  );
  return `${o.year}-${o.month}-${o.day}`;
}

/** Tuotteen toimitusalue: variants.toimitusalue ("eu" tai "us"), muuten varovainen oletus. */
export function toimitusalue(tuote?: { variants?: Record<string, unknown> } | null): ToimitusAlue {
  const a = tuote?.variants?.toimitusalue;
  return a === "eu" || a === "us" ? a : OLETUSALUE;
}

export interface Toimitusarvio {
  aikaisin: Paiva;
  viimeistaan: Paiva;
}

/** Arvio, kun tilaus tehdään annettuna päivänä: tuotanto + kuljetus arkipäivinä tilauspäivän jälkeen. */
export function toimitusarvio(tilauspaiva: Paiva, profiili: ToimitusProfiili | ToimitusAlue = OLETUSALUE): Toimitusarvio {
  const p = typeof profiili === "string" ? TOIMITUSPROFIILIT[profiili] : profiili;
  return {
    aikaisin: lisaaArkipaivia(tilauspaiva, p.tuotanto[0] + p.kuljetus[0]),
    viimeistaan: lisaaArkipaivia(tilauspaiva, p.tuotanto[1] + p.kuljetus[1]),
  };
}

/** Kauden joulun raja ("YYYY-12-23") tilauspäivän vuodelta. */
export const joulunRaja = (paiva: Paiva): Paiva => `${paiva.slice(0, 4)}-${JOULU_RAJA}`;

/**
 * "Ehtii jouluksi" vain, kun tilauspäivä on joulusesongissa (15.10. alkaen) ja arvion myöhäisin päivä on
 * viimeistään 23.12. samana vuonna. Muulloin ei koskaan.
 */
export function ehtiiJouluksi(tilauspaiva: Paiva, profiili: ToimitusProfiili | ToimitusAlue = OLETUSALUE): boolean {
  const vuosi = tilauspaiva.slice(0, 4);
  if (tilauspaiva < `${vuosi}-${JOULUSESONKI_ALKAA}`) return false;
  if (typeof profiili === "string" && tilauspaiva > `${vuosi}-${JOULU_VIIMEINEN_TILAUSPAIVA[profiili]}`) return false;
  const raja = joulunRaja(tilauspaiva);
  if (tilauspaiva > raja) return false;
  return toimitusarvio(tilauspaiva, profiili).viimeistaan <= raja;
}

/** Viimeinen tilauspäivä, jolla paketti on arvion mukaan perillä viimeistään 23.12. annettuna vuonna. */
export function joulunViimeinenTilauspaiva(vuosi: number, profiili: ToimitusProfiili | ToimitusAlue = OLETUSALUE): Paiva {
  const raja = `${vuosi}-${JOULU_RAJA}`;
  let d = raja;
  while (toimitusarvio(d, profiili).viimeistaan > raja) d = lisaaPaivia(d, -1);
  // Printifyn takaraja (src/config/toimitusajat.ts) ei saa jäädä ylittämättä.
  const katto = typeof profiili === "string" ? `${vuosi}-${JOULU_VIIMEINEN_TILAUSPAIVA[profiili]}` : null;
  return katto && katto < d ? katto : d;
}

/** Joulun viimeiset tilauspäivät kaikille toimitusalueille (muiden sivujen käyttöön). */
export function joulunViimeisetTilauspaivat(vuosi: number): Record<ToimitusAlue, Paiva> {
  return {
    eu: joulunViimeinenTilauspaiva(vuosi, "eu"),
    us: joulunViimeinenTilauspaiva(vuosi, "us"),
  };
}

/** "ti 10.11." -muoto asiakkaalle. */
export function muotoilePaiva(s: Paiva): string {
  const d = pvm(s);
  const vp = ["su", "ma", "ti", "ke", "to", "pe", "la"][d.getUTCDay()];
  return `${vp} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}

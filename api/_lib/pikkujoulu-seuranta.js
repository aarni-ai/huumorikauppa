/**
 * Pikkujoulupakettien seuranta (4.11.2026, /pikkujoulut-yritykset): koostemäärä päivä x tapahtuma x paketti, ei
 * evästeitä eikä tunnisteita (kuten api/_lib/lisamyynti.js). Selain (src/lib/pikkujouluSeuranta.ts) lähettää
 * tapahtuman src/lib/aitous.ts lahetaKunLuokiteltu-kutsulla; api/sahkoposti.js ohittaa botit ja oman liikenteen.
 *
 * Tapahtumat:
 *   sivu      sivu avattiin (kerran sivulatausta kohden)
 *   paketti   paketti valittiin (paketin tunnus, kerran pakettia kohden sivulatauksessa)
 *   tarjous   tarjouspyyntö lähetettiin onnistuneesti (paketin tunnus)
 * Tallennetut tarjouspyynnöt luetaan lisäksi taulusta tarjouspyynnot (lahde = "pikkujoulut-yritykset").
 */
import { PIKKUJOULU_PAKETIT, PIKKUJOULU_LAHDE } from "./pikkujoulut.js";

export const PIKKUJOULU_TAPAHTUMAT = ["sivu", "paketti", "tarjous"];
const PAKETTI_IDT = PIKKUJOULU_PAKETIT.map((p) => p.id);

export async function varmistaPikkujoulu(db) {
  await db`create table if not exists pikkujoulu_seuranta (paiva date not null, tapahtuma text not null, paketti text not null default '',
    n integer not null default 0, primary key (paiva, tapahtuma, paketti))`;
}

export async function kirjaaPikkujoulu(db, tapahtuma, paketti = "") {
  if (!PIKKUJOULU_TAPAHTUMAT.includes(tapahtuma)) return false;
  const p = PAKETTI_IDT.includes(paketti) ? paketti : "";
  if (tapahtuma !== "sivu" && !p) return false;
  await varmistaPikkujoulu(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into pikkujoulu_seuranta (paiva, tapahtuma, paketti, n) values (${paiva}::date, ${tapahtuma}, ${tapahtuma === "sivu" ? "" : p}, 1)
    on conflict (paiva, tapahtuma, paketti) do update set n = pikkujoulu_seuranta.n + 1`;
  return true;
}

/**
 * Rivit { tapahtuma, paketti, n } ja tallennetut tarjouspyynnöt { paketti, n } -> kooste:
 * { sivu, paketti, tarjous, tallennetut, paketeittain: { "pikkujoulu-10": { paketti, tarjous, tallennetut } } }.
 */
export function koostaPikkujoulu(rivit, tallennetut = []) {
  const k = { sivu: 0, paketti: 0, tarjous: 0, tallennetut: 0, paketeittain: Object.fromEntries(PAKETTI_IDT.map((id) => [id, { paketti: 0, tarjous: 0, tallennetut: 0 }])) };
  for (const r of rivit) {
    const n = Number(r.n) || 0;
    if (!PIKKUJOULU_TAPAHTUMAT.includes(r.tapahtuma)) continue;
    k[r.tapahtuma] += n;
    if (r.tapahtuma !== "sivu" && k.paketeittain[r.paketti]) k.paketeittain[r.paketti][r.tapahtuma] += n;
  }
  for (const t of tallennetut) {
    const n = Number(t.n) || 0;
    k.tallennetut += n;
    if (k.paketeittain[t.paketti]) k.paketeittain[t.paketti].tallennetut += n;
  }
  return k;
}

export async function pikkujouluValilla(db, alku, loppu) {
  await varmistaPikkujoulu(db);
  const rivit = await db`select tapahtuma, paketti, sum(n)::int as n from pikkujoulu_seuranta where paiva between ${alku}::date and ${loppu}::date group by 1, 2`;
  let tallennetut = [];
  try {
    tallennetut = await db`select paketti, count(*)::int as n from tarjouspyynnot where lahde = ${PIKKUJOULU_LAHDE} and tila <> 'testi'
      and (created_at at time zone 'Europe/Helsinki')::date between ${alku}::date and ${loppu}::date group by 1`;
  } catch { /* taulua tai saraketta ei vielä ole */ }
  return { alku, loppu, ...koostaPikkujoulu(rivit, tallennetut) };
}

/** Mittarin ja päivän yhteenvedon rivi. */
export function pikkujouluRivi(s) {
  const p = Object.entries(s.paketeittain).map(([id, x]) => `${id.replace("pikkujoulu-", "")} kpl: valittu ${x.paketti}, pyyntöjä ${x.tallennetut}`).join("; ");
  return `Pikkujoulupaketit ${s.alku} alkaen: sivukäynnit ${s.sivu}, paketin valinnat ${s.paketti}, tarjouspyynnöt ${s.tallennetut} (selaimen kirjaamat ${s.tarjous}); ${p}.`;
}

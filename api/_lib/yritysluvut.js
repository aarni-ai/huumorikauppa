/**
 * Yritysmyynnin päiväluvut (1.11.2026): yritysviestejä lähetetty, vastauksia, tarjouspyyntöjä ja tilauksia. Cowork
 * kirjaa päivän luvut lomakkeella /hallinta/mittarit tai suoraan rajapintaan:
 *   POST /api/sahkoposti { action: "yritysluvut", avain, paiva: "YYYY-MM-DD", viestit, vastaukset, tarjouspyynnot, tilaukset, huom }
 * avain = mittarisivun avain (cron ?tehtava=hallinta-linkki "mittarit"). Sama päivä uudelleen korvaa luvut.
 * Mittari (api/_lib/mittarit.js) näyttää kuukauden ja 30 päivän summat sekä viimeiset päivät.
 */
export const YRITYSLUKU_KENTAT = ["viestit", "vastaukset", "tarjouspyynnot", "tilaukset"];

/** Tarkistaa kirjauksen: { ok, rivi } tai { ok: false, virhe }. */
export function tarkistaYritysluvut(body, tanaan) {
  const paiva = String(body?.paiva || tanaan);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paiva) || Number.isNaN(Date.parse(`${paiva}T12:00:00Z`))) return { ok: false, virhe: "Päivä muodossa VVVV-KK-PP." };
  if (paiva > tanaan) return { ok: false, virhe: "Päivä ei voi olla tulevaisuudessa." };
  const rivi = { paiva };
  for (const k of YRITYSLUKU_KENTAT) {
    const n = Number(body?.[k] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 10000) return { ok: false, virhe: `${k}: kokonaisluku 0-10000.` };
    rivi[k] = n;
  }
  rivi.huom = typeof body?.huom === "string" ? body.huom.trim().slice(0, 300) : null;
  return { ok: true, rivi };
}

async function varmista(db) {
  await db`create table if not exists yritysluvut (paiva date primary key, viestit integer not null default 0,
    vastaukset integer not null default 0, tarjouspyynnot integer not null default 0, tilaukset integer not null default 0,
    huom text, updated_at timestamptz not null default now())`;
}

export async function tallennaYritysluvut(db, r) {
  await varmista(db);
  await db`insert into yritysluvut (paiva, viestit, vastaukset, tarjouspyynnot, tilaukset, huom)
    values (${r.paiva}::date, ${r.viestit}, ${r.vastaukset}, ${r.tarjouspyynnot}, ${r.tilaukset}, ${r.huom})
    on conflict (paiva) do update set viestit = excluded.viestit, vastaukset = excluded.vastaukset,
      tarjouspyynnot = excluded.tarjouspyynnot, tilaukset = excluded.tilaukset, huom = excluded.huom, updated_at = now()`;
}

/** Päivärivit väliltä [alku, loppu] (YYYY-MM-DD) uusin ensin. */
export async function yritysluvutValilla(db, alku, loppu) {
  await varmista(db);
  return db`select to_char(paiva, 'YYYY-MM-DD') as paiva, viestit, vastaukset, tarjouspyynnot, tilaukset, huom
    from yritysluvut where paiva between ${alku}::date and ${loppu}::date order by paiva desc`;
}

export function summaaYritysluvut(rivit) {
  const s = Object.fromEntries(YRITYSLUKU_KENTAT.map((k) => [k, 0]));
  for (const r of rivit) for (const k of YRITYSLUKU_KENTAT) s[k] += Number(r[k]) || 0;
  return { ...s, vastausprosentti: s.viestit ? Math.round((s.vastaukset / s.viestit) * 1000) / 10 : null, paivia: rivit.length };
}

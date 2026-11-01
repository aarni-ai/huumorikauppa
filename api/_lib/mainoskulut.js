/**
 * Mainoskulut (1.11.2026): Google Ads -kokeilun tulos näkyy mittarissa heti (mainoskulut, kustannus per tilaus, kate
 * mainoskulujen jälkeen). Ennen kampanjan käynnistystä kaikki on nollaa. Cowork kirjaa päivän kulut Google Adsista
 * lomakkeella /hallinta/mittarit tai rajapintaan:
 *   POST /api/sahkoposti { action: "mainoskulut", avain, paiva: "YYYY-MM-DD", kanava: "google-ads", kulut, klikit, konversiot, huom }
 * avain = mittarisivun avain. Sama päivä ja kanava uudelleen korvaa luvut.
 */
export const KANAVAT = ["google-ads", "meta", "tiktok", "pinterest", "muu"];

export function tarkistaMainoskulut(body, tanaan) {
  const paiva = String(body?.paiva || tanaan);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paiva) || Number.isNaN(Date.parse(`${paiva}T12:00:00Z`))) return { ok: false, virhe: "Päivä muodossa VVVV-KK-PP." };
  if (paiva > tanaan) return { ok: false, virhe: "Päivä ei voi olla tulevaisuudessa." };
  const kanava = String(body?.kanava || "google-ads");
  if (!KANAVAT.includes(kanava)) return { ok: false, virhe: `Kanava: ${KANAVAT.join(", ")}.` };
  const kulut = Math.round(Number(String(body?.kulut ?? 0).replace(",", ".")) * 100) / 100;
  if (!Number.isFinite(kulut) || kulut < 0 || kulut > 10000) return { ok: false, virhe: "kulut: euroina 0-10000." };
  const rivi = { paiva, kanava, kulut };
  for (const k of ["klikit", "konversiot"]) {
    const n = Number(body?.[k] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 1000000) return { ok: false, virhe: `${k}: kokonaisluku.` };
    rivi[k] = n;
  }
  rivi.huom = typeof body?.huom === "string" ? body.huom.trim().slice(0, 300) : null;
  return { ok: true, rivi };
}

async function varmista(db) {
  await db`create table if not exists mainoskulut (paiva date not null, kanava text not null, kulut numeric(10,2) not null default 0,
    klikit integer not null default 0, konversiot integer not null default 0, huom text, updated_at timestamptz not null default now(),
    primary key (paiva, kanava))`;
}

export async function tallennaMainoskulut(db, r) {
  await varmista(db);
  await db`insert into mainoskulut (paiva, kanava, kulut, klikit, konversiot, huom)
    values (${r.paiva}::date, ${r.kanava}, ${r.kulut}, ${r.klikit}, ${r.konversiot}, ${r.huom})
    on conflict (paiva, kanava) do update set kulut = excluded.kulut, klikit = excluded.klikit,
      konversiot = excluded.konversiot, huom = excluded.huom, updated_at = now()`;
}

export async function mainoskulutValilla(db, alku, loppu) {
  await varmista(db);
  return db`select to_char(paiva, 'YYYY-MM-DD') as paiva, kanava, kulut, klikit, konversiot, huom
    from mainoskulut where paiva between ${alku}::date and ${loppu}::date order by paiva desc, kanava`;
}

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Kuukauden mainonta: { kulut, klikit, konversiot, tilauksia, kustannusPerTilaus, kateMainonnanJalkeen }.
 * Kustannus per tilaus = mainoskulut / kuukauden tilaukset (kaikki kanavat). Ilman kuluja 0 €; kuluja mutta ei
 * tilauksia: null (näytetään "-").
 */
export function mainontaYhteenveto(rivit, { tilauksia = 0, kate = 0 } = {}) {
  const kulut = r2(rivit.reduce((s, r) => s + (Number(r.kulut) || 0), 0));
  const klikit = rivit.reduce((s, r) => s + (Number(r.klikit) || 0), 0);
  const konversiot = rivit.reduce((s, r) => s + (Number(r.konversiot) || 0), 0);
  const kustannusPerTilaus = kulut === 0 ? 0 : tilauksia ? r2(kulut / tilauksia) : null;
  return { kulut, klikit, konversiot, tilauksia, kustannusPerTilaus, kateMainonnanJalkeen: r2(kate - kulut) };
}

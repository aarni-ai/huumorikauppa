/**
 * Oma ostosuppilo (2.11.2026): koostemäärät päivä x vaihe x A/B-versio, ei evästeitä eikä tunnisteita (kuten
 * käyntilaskuri api/_lib/kaynnit.js). Selain (src/lib/suppilo.ts) kirjaa kunkin vaiheen kerran sivulatausta kohden:
 *   etusivu (A/B-testin näyttö), tuotesivu, kori (lisäys koriin), kassa (kassasivu avattu), maksu (siirto Stripeen)
 * Ostot luetaan maksetuista tilauksista (orders.ab_versio kertoo version). Mittari: api/_lib/mittarit.js.
 *
 * Luotettava 2.11.2026 alkaen (SUPPILO_LUOTETTAVA_ALKAEN): laskuri julkaistiin 1.11. iltapäivällä, ja ennen
 * 2.11.2026 mittari laski 14 päivän ostot myös ajalta ennen laskuria (osto 29.10. ilman yhtään kirjattua vaihetta).
 * Nyt sekä vaiheet että ostot rajataan samaan jaksoon. Selaintestit (Playwright, scripts/suppilo-testi.mjs)
 * kirjautuvat versioon "testi", joka ei näy summissa.
 */
// 3.11.2026: oma liikenne ja botit suodatetaan 2.11. iltapäivästä alkaen (api/_lib/kaynnit.js onOmaTaiBotti). 2.11.
// suppilossa on mukana lahjaoppaan linkkien tarkistus (62 tuotesivua), jota ei voi jälkikäteen erottaa vaiheista.
export const SUPPILO_LUOTETTAVA_ALKAEN = "2026-11-03";
export const TESTI = "testi";
export const VAIHEET = ["etusivu", "tuotesivu", "kori", "kassa", "maksu"];
export const AB_VERSIOT = ["a", "b"];

export async function varmistaSuppilo(db) {
  await db`create table if not exists suppilo (paiva date not null, vaihe text not null, versio text not null default '',
    n integer not null default 0, primary key (paiva, vaihe, versio))`;
  await db`alter table orders add column if not exists ab_versio text`;
}

export const versio = (v) => (AB_VERSIOT.includes(v) ? v : "");

export async function kirjaaVaihe(db, vaihe, v = "", { testi = false } = {}) {
  if (!VAIHEET.includes(vaihe)) return false;
  await varmistaSuppilo(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into suppilo (paiva, vaihe, versio, n) values (${paiva}::date, ${vaihe}, ${testi ? TESTI : versio(v)}, 1)
    on conflict (paiva, vaihe, versio) do update set n = suppilo.n + 1`;
  return true;
}

const r1 = (x) => Math.round(x * 10) / 10;
const pros = (a, b) => (b ? r1((a / b) * 100) : null);

/**
 * Päivittäinen suppilo: rivit { paiva, vaihe, versio, n }, ostot { paiva, versio, n }, kaynnit { paiva: n }.
 * Palauttaa { paivat: [{ paiva, kaynnit, tuotesivu, kori, kassa, maksu, ostot, konversio }], yhteensa, pudotus, ab }.
 * pudotus: vaiheesta seuraavaan jatkaneiden osuus ja pudonneiden osuus prosentteina.
 */
export function koostaSuppilo(rivit, ostot, kaynnit = {}) {
  const paivat = new Map();
  const paiva = (p) => {
    if (!paivat.has(p)) paivat.set(p, { paiva: p, kaynnit: Number(kaynnit[p] || 0), etusivu: 0, tuotesivu: 0, kori: 0, kassa: 0, maksu: 0, ostot: 0 });
    return paivat.get(p);
  };
  for (const p of Object.keys(kaynnit)) paiva(p);
  const ab = Object.fromEntries(AB_VERSIOT.map((v) => [v, { etusivu: 0, tuotesivu: 0, kori: 0, kassa: 0, maksu: 0, ostot: 0 }]));
  const testi = Object.fromEntries(VAIHEET.map((v) => [v, 0]));
  for (const r of rivit) {
    if (r.versio === TESTI) { if (VAIHEET.includes(r.vaihe)) testi[r.vaihe] += Number(r.n) || 0; continue; }
    const d = paiva(r.paiva);
    if (VAIHEET.includes(r.vaihe)) d[r.vaihe] += Number(r.n) || 0;
    if (ab[r.versio] && VAIHEET.includes(r.vaihe)) ab[r.versio][r.vaihe] += Number(r.n) || 0;
  }
  for (const o of ostot) {
    paiva(o.paiva).ostot += Number(o.n) || 0;
    if (ab[o.versio]) ab[o.versio].ostot += Number(o.n) || 0;
  }
  const lista = [...paivat.values()].sort((a, b) => b.paiva.localeCompare(a.paiva)).map((d) => ({ ...d, konversio: pros(d.ostot, d.kaynnit) }));
  const yhteensa = lista.reduce((s, d) => { for (const k of ["kaynnit", "etusivu", "tuotesivu", "kori", "kassa", "maksu", "ostot"]) s[k] += d[k]; return s; },
    { kaynnit: 0, etusivu: 0, tuotesivu: 0, kori: 0, kassa: 0, maksu: 0, ostot: 0 });
  yhteensa.konversio = pros(yhteensa.ostot, yhteensa.kaynnit);
  const ketju = [["kaynnit", "tuotesivu"], ["tuotesivu", "kori"], ["kori", "kassa"], ["kassa", "maksu"], ["maksu", "ostot"]];
  const pudotus = ketju.map(([a, b]) => ({ vaihe: `${a} -> ${b}`, jatkoi: pros(yhteensa[b], yhteensa[a]), putosi: yhteensa[a] ? r1(100 - (yhteensa[b] / yhteensa[a]) * 100) : null }));
  for (const v of AB_VERSIOT) ab[v].konversio = pros(ab[v].ostot, ab[v].etusivu);
  return { paivat: lista, yhteensa, pudotus, ab, testi };
}

export async function suppiloValilla(db, alkuPyydetty, loppu, kaynnitKaikki = {}) {
  await varmistaSuppilo(db);
  // Vaiheet, ostot ja käynnit samalta jaksolta, aikaisintaan luotettavasta päivästä.
  const alku = alkuPyydetty < SUPPILO_LUOTETTAVA_ALKAEN ? SUPPILO_LUOTETTAVA_ALKAEN : alkuPyydetty;
  const kaynnit = Object.fromEntries(Object.entries(kaynnitKaikki).filter(([p]) => p >= alku));
  const rivit = await db`select to_char(paiva, 'YYYY-MM-DD') as paiva, vaihe, versio, n from suppilo where paiva between ${alku}::date and ${loppu}::date`;
  const ostot = await db`select to_char(paid_at at time zone 'Europe/Helsinki', 'YYYY-MM-DD') as paiva, coalesce(ab_versio, '') as versio, count(*)::int as n
    from orders where status = 'maksettu' and paid_at is not null
      and customer_email not like 'kassatesti@%' and customer_email not like '%@huumorikauppa.fi'
      and (paid_at at time zone 'Europe/Helsinki')::date between ${alku}::date and ${loppu}::date group by 1, 2`;
  return { ...koostaSuppilo(rivit, ostot, kaynnit), alku, loppu, luotettavaAlkaen: SUPPILO_LUOTETTAVA_ALKAEN };
}

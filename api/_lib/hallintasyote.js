/**
 * Tiedonvälitys Coworkilta (5.11.2026): /hallinta/syote, jonne Cowork liittää tekstiä tai CSV:tä otsikolla
 * ("Search Console 28 pv", "Merchant klikit", "Instagram tilastot"). Tallennus tauluun hallinta_syote.
 * Koneelle: scripts/syote-lue.mjs (cron ?tehtava=syote, CRON_SECRET).
 *
 * Analyysit (ajetaan koneella syote-lue.mjs --analyysi):
 *  - hakuKohteet: Search Consolen hakulausekkeet, joiden keskimääräinen sijainti on 5-30, näyttökertojen mukaan.
 *  - sijaintiSeuranta: saman otsikon merkinnät aikajärjestyksessä, hakulausekkeen sijainti viikoittain.
 *  - merchantKohteet: tuotteet, joilla on paljon näyttökertoja mutta klikkausprosentti alle puolet kaikkien tuotteiden
 *    keskiarvosta.
 */

export const OTSIKKO_MAX = 100;
export const SISALTO_MAX = 1_000_000;
export const EHDOTUKSET = ["Search Console 28 pv", "Search Console sivut 28 pv", "Merchant klikit", "Instagram tilastot", "TikTok tilastot", "Pinterest tilastot", "Muu"];

export async function varmista(db) {
  await db`create table if not exists hallinta_syote (id bigserial primary key, otsikko text not null, sisalto text not null,
    muoto text not null default 'teksti', rivit int not null default 0, luotu timestamptz not null default now())`;
}

/**
 * "csv:\t" / "csv:;" / "csv:," kun vähintään 2 riviä ja yleisin kenttämäärä (yli 1) toistuu vähintään 60 %:lla
 * ensimmäisistä 50 rivistä (alussa saa olla selitysrivejä). Muuten "teksti".
 */
export function tunnistaMuoto(sisalto) {
  const rivit = String(sisalto).split(/\r?\n/).filter((r) => r.trim()).slice(0, 50);
  if (rivit.length < 2) return "teksti";
  for (const e of ["\t", ";", ","]) {
    const maarat = {};
    for (const r of rivit) { const m = erottele(r, e).length; maarat[m] = (maarat[m] || 0) + 1; }
    const [m, kpl] = Object.entries(maarat).sort((a, b) => b[1] - a[1])[0];
    if (Number(m) > 1 && kpl >= Math.max(2, rivit.length * 0.6)) return `csv:${e}`;
  }
  return "teksti";
}

export function validoi({ otsikko, sisalto } = {}) {
  const o = String(otsikko ?? "").replace(/\s+/g, " ").trim();
  const s = String(sisalto ?? "").replace(/^﻿/, "");
  if (!o) return { ok: false, virhe: "Otsikko puuttuu." };
  if (o.length > OTSIKKO_MAX) return { ok: false, virhe: `Otsikko on yli ${OTSIKKO_MAX} merkkiä.` };
  if (!s.trim()) return { ok: false, virhe: "Sisältö puuttuu." };
  if (s.length > SISALTO_MAX) return { ok: false, virhe: "Sisältö on liian pitkä (yli 1 000 000 merkkiä). Jaa se osiin." };
  return { ok: true, otsikko: o, sisalto: s, muoto: tunnistaMuoto(s), rivit: s.split(/\r?\n/).filter((r) => r.trim()).length };
}

export async function tallennaSyote(db, syote) {
  const v = validoi(syote);
  if (!v.ok) return v;
  await varmista(db);
  const [r] = await db`insert into hallinta_syote (otsikko, sisalto, muoto, rivit) values (${v.otsikko}, ${v.sisalto}, ${v.muoto}, ${v.rivit})
    returning id, luotu`;
  return { ok: true, id: Number(r.id), luotu: r.luotu, otsikko: v.otsikko, muoto: v.muoto, rivit: v.rivit };
}

/** Uusimmat merkinnät ilman koko sisältöä (hallintasivu). */
export async function listaaSyotteet(db, { maara = 30 } = {}) {
  await varmista(db);
  const rivit = await db`select id, otsikko, muoto, rivit, luotu, length(sisalto) as koko, left(sisalto, 300) as alku
    from hallinta_syote order by luotu desc, id desc limit ${Math.min(Math.max(Number(maara) || 30, 1), 200)}`;
  return rivit.map((r) => ({ ...r, id: Number(r.id), koko: Number(r.koko) }));
}

/** Koko merkinnät koneelle: id, tai otsikon osa (kirjainkoosta riippumatta), uusimmat ensin. */
export async function haeSyotteet(db, { id = null, otsikko = null, maara = 5 } = {}) {
  await varmista(db);
  const n = Math.min(Math.max(Number(maara) || 5, 1), 100);
  const rivit = id
    ? await db`select * from hallinta_syote where id = ${Number(id)}`
    : otsikko
      ? await db`select * from hallinta_syote where otsikko ilike ${`%${String(otsikko).replace(/[%_\\]/g, "\\$&")}%`} order by luotu desc, id desc limit ${n}`
      : await db`select * from hallinta_syote order by luotu desc, id desc limit ${n}`;
  return rivit.map((r) => ({ ...r, id: Number(r.id) }));
}

// ── CSV ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function erottele(rivi, e) {
  const out = [];
  let kentta = "", lainaus = false;
  for (let i = 0; i < rivi.length; i++) {
    const c = rivi[i];
    if (lainaus) {
      if (c === '"' && rivi[i + 1] === '"') { kentta += '"'; i++; }
      else if (c === '"') lainaus = false;
      else kentta += c;
    } else if (c === '"') lainaus = true;
    else if (c === e) { out.push(kentta); kentta = ""; }
    else kentta += c;
  }
  out.push(kentta);
  return out.map((x) => x.trim());
}

/** CSV-teksti olioiksi otsikkorivin mukaan. Ohittaa alun selitysrivit, joilla on eri sarakemäärä. */
export function jasennaCsv(sisalto) {
  const muoto = tunnistaMuoto(sisalto);
  if (!muoto.startsWith("csv:")) return [];
  const e = muoto.slice(4);
  const rivit = String(sisalto).replace(/^﻿/, "").split(/\r?\n/).filter((r) => r.trim()).map((r) => erottele(r, e));
  const maarat = {};
  for (const r of rivit) maarat[r.length] = (maarat[r.length] || 0) + 1;
  const leveys = Number(Object.entries(maarat).sort((a, b) => b[1] - a[1])[0][0]);
  const [otsikot, ...data] = rivit.filter((r) => r.length === leveys);
  return data.map((r) => Object.fromEntries(otsikot.map((o, i) => [o, r[i] ?? ""])));
}

/** "1 234" -> 1234, "3,5 %" -> 3.5, "12.3" -> 12.3, "" -> null. */
export function luku(x) {
  const s = String(x ?? "").replace(/[\s %]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const sarake = (rivi, nimet) => {
  const avaimet = Object.keys(rivi);
  for (const n of nimet) {
    const k = avaimet.find((a) => a.toLowerCase().replace(/\s+/g, " ").trim() === n.toLowerCase());
    if (k) return k;
  }
  for (const n of nimet) {
    const k = avaimet.find((a) => a.toLowerCase().includes(n.toLowerCase()));
    if (k) return k;
  }
  return null;
};

const HAKU = {
  kysely: ["Suosituimmat kyselyt", "Kysely", "Hakulauseke", "Top queries", "Query"],
  sivu: ["Suosituimmat sivut", "Sivu", "Top pages", "Page", "URL"],
  klikit: ["Klikkaukset", "Klikit", "Clicks"],
  nayttot: ["Näyttökerrat", "Näytöt", "Impressiot", "Impressions"],
  sijainti: ["Sijainti", "Keskimääräinen sijainti", "Position", "Average position"],
};

/** Search Consolen rivit, joiden sijainti on 5-30, näyttökertojen mukaan. Palauttaa myös tunnistetut sarakkeet. */
export function hakuKohteet(rivit, { min = 5, max = 30 } = {}) {
  if (!rivit.length) return { sarakkeet: null, kohteet: [] };
  const s = Object.fromEntries(Object.entries(HAKU).map(([k, n]) => [k, sarake(rivit[0], n)]));
  if (!(s.kysely || s.sivu) || !s.sijainti) return { sarakkeet: s, kohteet: [], virhe: "Kysely- tai sijaintisaraketta ei tunnistettu." };
  const kohteet = rivit.map((r) => ({
    kysely: s.kysely ? r[s.kysely] : null, sivu: s.sivu ? r[s.sivu] : null,
    klikit: luku(r[s.klikit]) ?? 0, nayttot: luku(r[s.nayttot]) ?? 0, sijainti: luku(r[s.sijainti]),
  })).filter((k) => k.sijainti != null && k.sijainti >= min && k.sijainti <= max)
    .sort((a, b) => b.nayttot - a.nayttot || a.sijainti - b.sijainti);
  return { sarakkeet: s, kohteet };
}

/** Sijainti viikoittain: merkinnät vanhimmasta uusimpaan, { kysely: [{ pvm, sijainti }] }. */
export function sijaintiSeuranta(merkinnat) {
  const tulos = {};
  for (const m of [...merkinnat].sort((a, b) => new Date(a.luotu) - new Date(b.luotu))) {
    const pvm = new Date(m.luotu).toISOString().slice(0, 10);
    for (const k of hakuKohteet(jasennaCsv(m.sisalto), { min: 0, max: 1000 }).kohteet) {
      const avain = k.kysely || k.sivu;
      (tulos[avain] ||= []).push({ pvm, sijainti: k.sijainti, nayttot: k.nayttot, klikit: k.klikit });
    }
  }
  return tulos;
}

const MERCHANT = {
  tuote: ["Tuotteen nimi", "Tuotenimi", "Nimike", "Otsikko", "Product title", "Title", "Tuote", "Product"],
  id: ["Tuotetunnus", "Item ID", "Offer ID", "Tunnus", "ID"],
  klikit: ["Klikkaukset", "Klikit", "Clicks"],
  nayttot: ["Näyttökerrat", "Näytöt", "Impressiot", "Impressions"],
};

/**
 * Merchantin tuotteet, joilla on paljon näyttöjä mutta vähän klikkejä: näytöt vähintään minNaytot ja klikkausprosentti
 * alle puolet kaikkien tuotteiden keskiarvosta. Järjestys: menetetyt klikit (näytöt x keskiarvo - klikit).
 */
export function merchantKohteet(rivit, { minNaytot = 100 } = {}) {
  if (!rivit.length) return { sarakkeet: null, kohteet: [] };
  const s = Object.fromEntries(Object.entries(MERCHANT).map(([k, n]) => [k, sarake(rivit[0], n)]));
  if (!(s.tuote || s.id) || !s.klikit || !s.nayttot) return { sarakkeet: s, kohteet: [], virhe: "Tuote-, klikki- tai näyttösaraketta ei tunnistettu." };
  const tuotteet = rivit.map((r) => ({ tuote: s.tuote ? r[s.tuote] : null, id: s.id ? r[s.id] : null, klikit: luku(r[s.klikit]) ?? 0, nayttot: luku(r[s.nayttot]) ?? 0 }))
    .filter((t) => t.nayttot > 0);
  const kaikkiN = tuotteet.reduce((a, t) => a + t.nayttot, 0);
  const keskiarvo = kaikkiN ? tuotteet.reduce((a, t) => a + t.klikit, 0) / kaikkiN : 0;
  const kohteet = tuotteet
    .map((t) => ({ ...t, ctr: t.klikit / t.nayttot, menetetyt: Math.round(t.nayttot * keskiarvo - t.klikit) }))
    .filter((t) => t.nayttot >= minNaytot && t.ctr < keskiarvo / 2)
    .sort((a, b) => b.menetetyt - a.menetetyt);
  return { sarakkeet: s, keskiarvo, kohteet };
}

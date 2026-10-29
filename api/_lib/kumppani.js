/**
 * Kumppanuusohjelma (hyväksytty 29.10.2026, KATTEET.md "Kumppanuusohjelma"). Asetukset api/_lib/vakiot.js KUMPPANUUS.
 *
 * Sääntö: provisio on enintään 10 % tilauksen tuotteiden arvosta ilman ALV:tä ja toimitusta, ja enintään summa, joka
 * jättää kauppaan provision jälkeen vähintään KUMPPANUUS.minKateEuroa (7,00 € 29.10.2026 alkaen, aiemmin 5,00 €)
 * nettokatetta. Jos tilauksen kate on raja tai alle, provisio on 0. Kate lasketaan Printifyn todellisilla kuluilla; kun kulua ei vielä tiedetä, provisio odottaa (0).
 *
 * Kumppanit ovat taulussa kumppanit (koodi, nimi, email, aktiivinen), ja niitä hallitaan cron-tehtävillä
 * ?tehtava=kumppani-lisaa ja ?tehtava=kumppani-poista. Kassa kirjaa hyväksytyn koodin tilauksen tapahtumaksi
 * "kumppani" ({ koodi }). Raportti: ?tehtava=kumppanit[&kuukausi=YYYY-MM].
 */
import { KUMPPANUUS, KUMPPANIT } from "./vakiot.js";

export const KUMPPANIKOODI = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Kumppaneille näytettävä sääntö (sivu /kumppanit ja viestipohja). */
export const PROVISIOSAANTO =
  `Provisio on ${KUMPPANUUS.provisioProsentti} % tilauksen tuotteiden arvosta (ilman arvonlisäveroa ja toimituskuluja) tilauksista, joista kaupalle jää provision jälkeen vähintään ${KUMPPANUUS.minKateEuroa.toFixed(2).replace(".", ",")} € katetta. Jos kate ei riitä täyteen ${KUMPPANUUS.provisioProsentti} %:iin, provisio on pienempi, ja jos tilauksen kate on ${KUMPPANUUS.minKateEuroa.toFixed(2).replace(".", ",")} € tai alle, provisiota ei makseta.`;

/** Koodin muoto: pienet kirjaimet, numerot ja väliviiva, 2-40 merkkiä. Palauttaa normalisoidun koodin tai null. */
export function kumppaniKoodinMuoto(arvo) {
  const k = String(arvo ?? "").trim().toLowerCase();
  return KUMPPANIKOODI.test(k) ? k : null;
}

/** Synkroninen tarkistus kiinteästä listasta (testit ja varalista KUMPPANIT). */
export function kumppaniKoodi(arvo, { asetukset = KUMPPANUUS, kumppanit = KUMPPANIT } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = kumppaniKoodinMuoto(arvo);
  return k && Object.prototype.hasOwnProperty.call(kumppanit, k) ? k : null;
}

/** Taulu kumppaneille (luodaan tarvittaessa, db/schema.sql). */
export async function varmistaKumppanitaulu(db) {
  await db`create table if not exists kumppanit (koodi text primary key, nimi text not null, email text,
    aktiivinen boolean not null default true, created_at timestamptz not null default now())`;
}

/** Hyväksytty, aktiivinen kumppanikoodi kannasta tai varalistasta; muuten null. */
export async function tarkistaKumppani(db, arvo, { asetukset = KUMPPANUUS } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = kumppaniKoodinMuoto(arvo);
  if (!k) return null;
  if (Object.prototype.hasOwnProperty.call(KUMPPANIT, k)) return k;
  try {
    await varmistaKumppanitaulu(db);
    const [r] = await db`select koodi from kumppanit where koodi = ${k} and aktiivinen limit 1`;
    return r ? k : null;
  } catch {
    return null;
  }
}

/**
 * Provisio ja sen peruste. tuotteet = tuotteiden summa alennusten jälkeen (sis. ALV), nettokate euroina ennen
 * provisiota (Printifyn todelliset kulut). tila: "taysi" (10 %), "rajattu" (kauppaan jää 7 €), "ei" (kate 7 € tai
 * alle) tai "kate-tuntematon" (Printify-kulu ei vielä tiedossa, provisio 0 kunnes kulu tiedetään).
 */
export function provisioJaTila(tuotteet, nettokate, asetukset = KUMPPANUUS) {
  if (!Number.isFinite(nettokate)) return { provisio: 0, tila: "kate-tuntematon" };
  const taysi = (Number(tuotteet) / 1.255) * (asetukset.provisioProsentti / 100);
  const varaa = nettokate - asetukset.minKateEuroa;
  if (varaa <= 0) return { provisio: 0, tila: "ei" };
  const p = Math.round(Math.min(taysi, varaa) * 100) / 100;
  return { provisio: p, tila: taysi <= varaa ? "taysi" : "rajattu" };
}

/** Provisio euroina (ks. provisioJaTila). */
export const provisio = (tuotteet, nettokate, asetukset = KUMPPANUUS) => provisioJaTila(tuotteet, nettokate, asetukset).provisio;

/** Kumppanin raporttiavaimen tarkoitus (api/_lib/markkinointi.js allekirjoita / tarkistaTunniste). */
export const RAPORTTI_TARKOITUS = "kumppaniraportti";

/** Klikkaukset päivittäin koodeittain (ei henkilötietoja, ei evästeitä): kumppanilinkin avaukset. */
export async function varmistaKlikkitaulu(db) {
  await db`create table if not exists kumppani_klikit (koodi text not null, paiva date not null,
    klikit integer not null default 0, primary key (koodi, paiva))`;
}

/** Kirjaa yhden kumppanilinkin avauksen, jos koodi on hyväksytty ja aktiivinen. Palauttaa true, jos kirjattiin. */
export async function kirjaaKlikki(db, arvo) {
  const koodi = await tarkistaKumppani(db, arvo);
  if (!koodi) return false;
  await varmistaKlikkitaulu(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into kumppani_klikit (koodi, paiva, klikit) values (${koodi}, ${paiva}::date, 1)
    on conflict (koodi, paiva) do update set klikit = kumppani_klikit.klikit + 1`;
  return true;
}

/**
 * Tilauksen nettokate ennen provisiota Printifyn todellisilla kuluilla (sama kaava kuin api/_lib/kate.js:
 * myynti / 1,255 - Printify-tuote ja -toimitus ilman ALV:tä - Stripe 1,5 % + 0,25 €). null, jos kulua ei vielä tiedetä.
 */
export async function tilauksenKate(tilaus, haeTilaus) {
  if (!tilaus.printify_order_id || !haeTilaus) return null;
  const h = await haeTilaus(tilaus.printify_order_id);
  if (!h?.ok || !h.data || h.data.status === "canceled") return null;
  const myynti = Number(tilaus.total) || 0;
  return myynti / 1.255 - ((Number(h.data.total_price) || 0) + (Number(h.data.total_shipping) || 0)) / 100 - (myynti * 0.015 + 0.25);
}

/**
 * Kumppanin oma raportti (/kumppanit/raportti): klikkaukset, tilaukset ja provisio kuukausittain. Ei asiakkaiden
 * henkilötietoja: tilauksista vain päivä, tuotteiden arvo ja provisio. Kumppanin nimestä vain etunimi.
 */
export async function kumppaniRaportti(db, koodi, { haeTilaus } = {}) {
  await varmistaKumppanitaulu(db);
  await varmistaKlikkitaulu(db);
  const [k] = await db`select koodi, nimi, created_at from kumppanit where koodi = ${koodi} and aktiivinen limit 1`;
  if (!k) return null;
  const klikit = await db`select to_char(paiva, 'YYYY-MM') as kuukausi, sum(klikit)::int as klikit
    from kumppani_klikit where koodi = ${koodi} group by 1`;
  const rivit = await db`select o.paid_at, o.total, o.shipping, o.printify_order_id
    from orders o join order_events e on e.order_id = o.id and e.kind = 'kumppani'
    where e.details->>'koodi' = ${koodi} and o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi'
    order by o.paid_at desc limit 500`;
  const kk = new Map(klikit.map((r) => [r.kuukausi, { kuukausi: r.kuukausi, klikit: r.klikit, tilauksia: 0, tuotteet: 0, provisio: 0, odottaa: 0 }]));
  const tilaukset = [];
  const r2 = (x) => Math.round(x * 100) / 100;
  for (const t of rivit) {
    const tuotteet = (Number(t.total) || 0) - (Number(t.shipping) || 0);
    const p = provisioJaTila(tuotteet, (await tilauksenKate(t, haeTilaus)) ?? NaN);
    const kuukausi = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(t.paid_at)).slice(0, 7);
    const m = kk.get(kuukausi) || { kuukausi, klikit: 0, tilauksia: 0, tuotteet: 0, provisio: 0, odottaa: 0 };
    m.tilauksia += 1;
    m.tuotteet = r2(m.tuotteet + tuotteet);
    m.provisio = r2(m.provisio + p.provisio);
    if (p.tila === "kate-tuntematon") m.odottaa += 1;
    kk.set(kuukausi, m);
    tilaukset.push({ pvm: new Date(t.paid_at).toISOString().slice(0, 10), tuotteet: r2(tuotteet), provisio: p.provisio, tila: p.tila });
  }
  const kuukaudet = [...kk.values()].sort((a, b) => b.kuukausi.localeCompare(a.kuukausi));
  const summa = (f) => r2(kuukaudet.reduce((s, m) => s + m[f], 0));
  return {
    koodi: k.koodi, etunimi: String(k.nimi || "").trim().split(/\s+/)[0] || k.koodi,
    linkki: `https://huumorikauppa.fi/?ref=${k.koodi}`, saanto: PROVISIOSAANTO,
    kuukaudet, tilaukset, yhteensa: { klikit: summa("klikit"), tilauksia: summa("tilauksia"), tuotteet: summa("tuotteet"), provisio: summa("provisio") },
  };
}

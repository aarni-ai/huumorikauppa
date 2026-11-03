/**
 * Ilmaisen toimituksen hintatesti (4.11.2026, KASVU-RAPORTTI.md "Ilmaisen toimituksen hintatesti").
 *
 *   A = nykyinen: tuotteen hinta + toimitusmaksu (vakiot.js TOIMITUS).
 *   B = hinta, johon toimitus sisältyy, ja teksti "Ilmainen toimitus": hinta + toimitusmaksu pyöristettynä ylöspäin
 *       ,90:aan (24,90 -> 31,90, 27,90 -> 34,90, huppari 52,90 -> 59,90).
 *
 * Sääntö (koskee()): B:n hinta on käytössä vain, kun tilaus maksaisi A:ssa täyden toimitusmaksun, eli
 *   - korissa on yksi toimituksen kerryttävä kappale (tarrat eivät lasketa, vakiot.js LISATUOTE_KATEGORIAT),
 *   - toimitusmaksu olisi täysi (ei ilmaisen toimituksen rajaa eikä katevahdin porrasta),
 *   - ei alennuskoodia, kumppanialennusta, paketti- tai korialennusta, eikä tuote ole alennusmyynnissä
 *     (original_price > price: yliviivattu hinta ja 30 päivän alin hinta koskevat perushintaa).
 * Kahden tai useamman tuotteen korissa toimitus on jo ilmainen (kahden tuotteen sääntö), joten B käyttää silloin
 * samoja hintoja kuin A (summa = A:n summa). Yhden tuotteen tilaus on B:ssä enintään pyöristyksen verran (0-0,99 €,
 * t-paita 24,90 -> 31,90) kalliimpi kuin A:ssa, ja kahden tuotteen kori on B:ssäkin tuotesivun hintaa halvempi
 * kappaleelta.
 *
 * Kate: B:n asiakas maksaa vähintään A:n summan, joten nettokate (kate.js laskeTilauksenNettokate: maksettu / 1,255
 * - Printify - Stripe) on B:ssä vähintään A:n tasolla (pyöristys 0-0,99 €, josta Stripe vie 1,5 %). Kassan lopullinen 7 €:n katevahti (kassa.js order_low_margin) koskee molempia versioita.
 * Testit: src/test/toimitustesti.test.ts.
 *
 * Versio: selain arpoo sen ja pitää sen käynnin ajan istuntoevästeessä hk_ab_toimitus (src/lib/abTestit.ts). Kassa
 * saa version pyynnössä (toimitusVersio) ja laskee hinnan itse: molemmat versiot ovat kelvollisia tarjouksia, joten
 * väitetty versio ei voi alentaa hintaa A:n alle. Merchant-syöte, JSON-LD ja esirenderöity HTML käyttävät aina A:ta.
 *
 * Mittaus (koosteet, ei tunnisteita): taulu toimitustesti päivä x versio x tapahtuma (kaynti, tuotesivu, kori,
 * kassa) sekä maksetut tilaukset orders.toimitus_versio ja orders.toimitus_kate. Päätös: kun kummassakin versiossa on
 * vähintään TOIMITUSTESTI_MIN_KATSELUT aitoa tuotesivun katselua, voittaja on suurempi kate per käynti.
 */
import { TOIMITUS, LISATUOTE_KATEGORIAT } from "./vakiot.js";

export const TOIMITUSTESTI_VERSIOT = ["a", "b"];
export const TOIMITUSTESTI_TAPAHTUMAT = ["kaynti", "tuotesivu", "kori", "kassa"];
export const TOIMITUSTESTI_MIN_KATSELUT = 300;
/** Testi alkoi (raportin oletusjakso). */
export const TOIMITUSTESTI_ALKAEN = "2026-11-04";

export const toimitusVersio = (v) => (v === "b" ? "b" : "a");

/** B:n hinta sentteinä: hinta + toimitus pyöristettynä ylöspäin seuraavaan ,90:ään. */
export function sisaltavaHintaSentit(hintaSentit, toimitusSentit = Math.round(TOIMITUS * 100)) {
  const summa = Math.round(hintaSentit) + toimitusSentit;
  let tulos = Math.floor(summa / 100) * 100 + 90;
  if (tulos < summa) tulos += 100;
  return tulos;
}

/** B:n hinta euroina (24.9 -> 31.9). */
export const sisaltavaHinta = (hinta, toimitus = TOIMITUS) => sisaltavaHintaSentit(Math.round(Number(hinta) * 100), Math.round(toimitus * 100)) / 100;

/**
 * Koskeeko B:n hinta tilausta: { versio, toimitusKpl, toimitus (A:n toimitusmaksu euroina), alennus (mikä tahansa
 * alennus: koodi, kumppani, paketti, korialennus) }.
 */
export function koskee({ versio, toimitusKpl, toimitus, alennus = false }) {
  return toimitusVersio(versio) === "b" && toimitusKpl === 1 && Math.abs(Number(toimitus) - TOIMITUS) < 0.005 && !alennus;
}

/** Alennusmyynnissä (yliviivattu hinta): B ei koske. */
export const alennusmyynnissa = (tuote) => Number(tuote?.original_price) > Number(tuote?.price);

/**
 * Kassan rivit B:n hinnalla. rivit: kassan fyysiset rivit ({ unit_cents, unit_price, quantity, product_id }),
 * tuote(product_id) -> tuoterivi. Palauttaa { rivit, toimitus: 0, hintaLisaSentit, lisaSentit } tai null.
 */
export function sovellaKassaan({ versio, rivit, toimitus, alennus, tuote }) {
  const toimittavat = rivit.filter((r) => !LISATUOTE_KATEGORIAT.includes(tuote(r.product_id)?.category));
  const kpl = toimittavat.reduce((s, r) => s + r.quantity, 0);
  if (!koskee({ versio, toimitusKpl: kpl, toimitus, alennus })) return null;
  const kohde = toimittavat[0];
  if (alennusmyynnissa(tuote(kohde.product_id))) return null;
  const uusiSentit = sisaltavaHintaSentit(kohde.unit_cents);
  const lisaSentit = uusiSentit - kohde.unit_cents - Math.round(TOIMITUS * 100);
  return {
    rivit: rivit.map((r) => (r === kohde ? { ...r, unit_cents: uusiSentit, unit_price: uusiSentit / 100, perushinta: r.unit_price, toimitus_sisaltyy: true } : r)),
    toimitus: 0,
    /** Tuotehinnan nousu (sentit), eli toimitusmaksu + pyöristys. */
    hintaLisaSentit: uusiSentit - kohde.unit_cents,
    /** Pyöristys A:n summaan verrattuna (0-99 senttiä). */
    lisaSentit,
  };
}

// ---------- Mittaus ----------

export async function varmistaToimitustesti(db) {
  await db`create table if not exists toimitustesti (paiva date not null, versio text not null, tapahtuma text not null,
    n integer not null default 0, primary key (paiva, versio, tapahtuma))`;
  await db`alter table orders add column if not exists toimitus_versio text`;
  await db`alter table orders add column if not exists toimitus_kate numeric`;
}

/** Selaimen tapahtuma (api/sahkoposti.js action "toimitustesti", botit ja oma liikenne pois ennen tätä). */
export async function kirjaaToimitustesti(db, body) {
  const tapahtuma = String(body?.tapahtuma || "");
  if (!TOIMITUSTESTI_TAPAHTUMAT.includes(tapahtuma) || !TOIMITUSTESTI_VERSIOT.includes(body?.versio)) return false;
  await varmistaToimitustesti(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into toimitustesti (paiva, versio, tapahtuma, n) values (${paiva}::date, ${body.versio}, ${tapahtuma}, 1)
    on conflict (paiva, versio, tapahtuma) do update set n = toimitustesti.n + 1`;
  return true;
}

/** Kassalla luodun tilauksen versio ja arvioitu nettokate (kassa.js laskettuNettokate). */
export async function merkitseTilaukselle(db, tilausId, versio, kate) {
  if (!TOIMITUSTESTI_VERSIOT.includes(versio)) return;
  await varmistaToimitustesti(db);
  await db`update orders set toimitus_versio = ${versio}, toimitus_kate = ${Number.isFinite(kate) ? Math.round(kate * 100) / 100 : null} where id = ${tilausId}`;
}

const r2 = (x) => Math.round(x * 100) / 100;
const pros = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

/**
 * rivit [{ versio, tapahtuma, n }], ostot [{ versio, n, kate }] -> { a: {...}, b: {...}, voittaja, paatos }.
 * Kate per käynti = maksettujen tilausten nettokate / käynnit. Voittaja vain, kun kummassakin versiossa on vähintään
 * min aitoa tuotesivun katselua.
 */
export function koostaToimitustesti(rivit, ostot, min = TOIMITUSTESTI_MIN_KATSELUT) {
  const v = Object.fromEntries(TOIMITUSTESTI_VERSIOT.map((x) => [x, { kaynti: 0, tuotesivu: 0, kori: 0, kassa: 0, ostot: 0, kate: 0 }]));
  for (const r of rivit) if (v[r.versio] && TOIMITUSTESTI_TAPAHTUMAT.includes(r.tapahtuma)) v[r.versio][r.tapahtuma] += Number(r.n) || 0;
  for (const o of ostot) if (v[o.versio]) { v[o.versio].ostot += Number(o.n) || 0; v[o.versio].kate += Number(o.kate) || 0; }
  for (const x of Object.values(v)) {
    x.kate = r2(x.kate);
    x.koriPros = pros(x.kori, x.tuotesivu);
    x.kassaPros = pros(x.kassa, x.tuotesivu);
    x.ostoPros = pros(x.ostot, x.kaynti);
    x.katePerKaynti = x.kaynti ? Math.round((x.kate / x.kaynti) * 1000) / 1000 : null;
  }
  const riittaa = TOIMITUSTESTI_VERSIOT.every((x) => v[x].tuotesivu >= min);
  let voittaja = null;
  let paatos;
  if (!riittaa) {
    paatos = `kesken: tuotesivun katseluja A ${v.a.tuotesivu} ja B ${v.b.tuotesivu}, raja ${min} kummassakin`;
  } else if ((v.a.katePerKaynti ?? 0) === (v.b.katePerKaynti ?? 0)) {
    paatos = "tasapeli kate per käynti: A jää käyttöön";
    voittaja = "a";
  } else {
    voittaja = (v.b.katePerKaynti ?? 0) > (v.a.katePerKaynti ?? 0) ? "b" : "a";
    paatos = `voittaja ${voittaja.toUpperCase()} (kate per käynti A ${v.a.katePerKaynti} €, B ${v.b.katePerKaynti} €)`;
  }
  return { ...v, voittaja, paatos, min };
}

export async function toimitustestiValilla(db, alku = TOIMITUSTESTI_ALKAEN, loppu = null) {
  await varmistaToimitustesti(db);
  const l = loppu || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  const rivit = await db`select versio, tapahtuma, sum(n)::int as n from toimitustesti where paiva between ${alku}::date and ${l}::date group by 1, 2`;
  const ostot = await db`select toimitus_versio as versio, count(*)::int as n, coalesce(sum(toimitus_kate), 0)::float as kate from orders
    where toimitus_versio is not null and paid_at is not null
      and (paid_at at time zone 'Europe/Helsinki')::date between ${alku}::date and ${l}::date group by 1`;
  return { alku, loppu: l, ...koostaToimitustesti(rivit, ostot) };
}

/** Päivän yhteenvedon ja raportin rivit. */
export function toimitustestiRivit(s) {
  if (!s) return [];
  const rivi = (x, nimi) => `${nimi}: ${x.kaynti} käyntiä, ${x.tuotesivu} tuotesivua, koriin ${x.kori} (${x.koriPros ?? "-"} %), kassalle ${x.kassa} (${x.kassaPros ?? "-"} %), ostoja ${x.ostot} (${x.ostoPros ?? "-"} % käynneistä), kate ${x.kate.toFixed(2).replace(".", ",")} €, kate per käynti ${x.katePerKaynti ?? "-"} €`;
  return [
    `Ilmaisen toimituksen hintatesti ${s.alku}–${s.loppu}: ${s.paatos}.`,
    `  ${rivi(s.a, `A (hinta + toimitus ${TOIMITUS.toFixed(2).replace(".", ",")} €)`)}`,
    `  ${rivi(s.b, "B (toimitus sisältyy, Ilmainen toimitus)")}`,
  ];
}

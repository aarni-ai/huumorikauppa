/**
 * "Ensimmäinen tilaus: −5 %" A/B-testinä (5.11.2026). Puhdas laskenta (selain ja palvelin) ja mittaus.
 *
 *   A = nykyinen: ei merkkiä eikä alennusta.
 *   B = tuotesivulla hinnan vieressä ja korissa merkki "Ensimmäinen tilaus: −5 %" (vain, kun alennus koskee tuotetta
 *       tai koria), ja kassa vähentää 5 % tuotteista (ei toimituksesta), kun tilaus on ensimmäinen.
 *
 * Ensimmäinen tilaus: samalla sähköpostiosoitteella ei ole maksettua tilausta (api/_lib/markkinointi-db.js
 * maksettujaTilauksia, sama tarkistus kuin TERVE-koodissa). Kassasivu kysyy osoitteen ennen maksua, joten palvelin
 * tarkistaa sen kassan alussa (api/checkout.js) ja Stripe Checkout näyttää valmiiksi alennetut rivit; Stripe ei salli
 * osoitteen vaihtoa, kun customer_email on annettu. Ei Stripen kuponkeja eikä maksullisia ominaisuuksia.
 *
 * Säännöt (kassa.js laskeTilaus):
 * - Vain versiossa B, vain ensimmäiseen tilaukseen, ei yhdessä alennuskoodin (myös TERVE-koodin), kumppanialennuksen,
 *   paketti-, kahden tuotteen tai määräalennuksen kanssa: tilauksessa on enintään yksi 5 %:n alennus.
 * - Katesääntö (api/_lib/katesaanto.js): alennus annetaan vain, jos tilauksen nettokate alennuksen ja toimituksen
 *   jälkeen on vähintään 7 € jokaista tilauksen kappaletta kohden. Muuten ei alennusta (ei pienempää prosenttia).
 * - Ilmaisen toimituksen hintatesti (api/_lib/toimitustesti.js) on erillinen testi omalla evästeellään. Sen B:ssä
 *   alennus lasketaan tuotteen perushinnasta (toimitus sisältyy hintaan, mutta toimitukseen ei anneta alennusta), ja
 *   katesääntö tarkistetaan B:n hinnalla ja 0 €:n toimituksella.
 *
 * Mittaus (koosteet, ei tunnisteita) kuten hintatestissä: taulu ensitilaustesti päivä x versio x tapahtuma (kaynti,
 * tuotesivu, kori, kassa; botit pois api/sahkoposti.js ohitaTaiBotti) sekä maksetut tilaukset
 * orders.ensitilaus_versio, orders.ensitilaus_kate ja orders.ensitilaus_alennus. Päätös: kun kummassakin versiossa on
 * vähintään ENSITILAUSTESTI_MIN_KATSELUT aitoa tuotesivun katselua, voittaja on suurempi kate per käynti.
 */
import { ENSITILAUS_ALENNUS_PROSENTTI } from "./vakiot.js";
import { laskeTilauksenNettokate } from "./kate.js";
import { katePerKpl, MIN_KATE_PER_KPL } from "./katesaanto.js";
import { koostaToimitustesti } from "./toimitustesti.js";

export const ENSITILAUSTESTI_VERSIOT = ["a", "b"];
export const ENSITILAUSTESTI_TAPAHTUMAT = ["kaynti", "tuotesivu", "kori", "kassa"];
export const ENSITILAUSTESTI_MIN_KATSELUT = 300;
/** Testi alkaa (raportin oletusjakso; selain arpoo B:n vasta tästä päivästä, src/lib/abTestit.ts). */
export const ENSITILAUSTESTI_ALKAEN = "2026-11-05";
/** Sama prosentti kuin TERVE-koodissa (vakiot.js), jotta tilauksessa on enintään yksi 5 %:n ensitilausalennus. */
export const ENSITILAUS_PROSENTTI = ENSITILAUS_ALENNUS_PROSENTTI;

export const ensitilausVersio = (v) => (v === "b" ? "b" : "a");

/** Alennus sentteinä hinnasta (sentit), pyöristys kuten muissa alennuksissa (kate.js alennettuSentit). */
export const alennusSentit = (sentit, prosentti = ENSITILAUS_PROSENTTI) => Math.round(sentit) - Math.round(Math.round(sentit) * (1 - prosentti / 100));

/**
 * Ensimmäisen tilauksen alennus katesäännöllä.
 * @param osat [{ tuote, varianttiId, maara, yksikkohinta (€, ennen tätä alennusta), pohja? (€, alennuksen pohja;
 *   oletus yksikkohinta, hintatestin B:ssä perushinta ilman sisältyvää toimitusta) }]
 * @param toimitus asiakkaan maksama toimitus euroina
 * Palauttaa { kaytossa, prosentti, alennus (€), katePerKpl, syy: null | "pois" | "kulu" | "kate" }.
 */
export function ensitilausAlennus(osat, toimitus, { prosentti = ENSITILAUS_PROSENTTI, min = MIN_KATE_PER_KPL } = {}) {
  const ei = (syy, kate = null) => ({ kaytossa: false, prosentti: 0, alennus: 0, katePerKpl: kate, syy });
  if (!(prosentti > 0) || !Array.isArray(osat) || osat.length === 0) return ei("pois");
  const kpl = osat.reduce((s, o) => s + (o.maara ?? 1), 0);
  let alennus = 0;
  const alennetut = osat.map((o) => {
    const a = alennusSentit(Math.round(Number(o.pohja ?? o.yksikkohinta) * 100), prosentti);
    alennus += a * (o.maara ?? 1);
    return { ...o, yksikkohinta: (Math.round(Number(o.yksikkohinta) * 100) - a) / 100 };
  });
  const k = laskeTilauksenNettokate(alennetut, toimitus);
  if (!k.tunnettu) return ei("kulu");
  const per = katePerKpl(k.nettokate, kpl);
  if (per < min) return ei("kate", Math.round(per * 100) / 100);
  return { kaytossa: true, prosentti, alennus: alennus / 100, katePerKpl: Math.round(per * 100) / 100, syy: null };
}

/**
 * Kassan rivit ensimmäisen tilauksen alennuksella (rivit: { unit_cents, unit_price, quantity, toimitus_sisaltyy?,
 * perushinta? }). Palauttaa uudet rivit; alennusSentit kuten ensitilausAlennus laskee.
 */
export function alennaRivit(rivit, prosentti = ENSITILAUS_PROSENTTI) {
  return rivit.map((r) => ({ ...r, unit_cents: r.unit_cents - alennusSentit(pohjaSentit(r), prosentti), ensitilaus_prosentti: prosentti }));
}

/** Kassan rivin alennuksen pohja sentteinä: hintatestin B:ssä perushinta (toimitus ei saa alennusta), muuten rivin hinta. */
export const pohjaSentit = (r) => (r.toimitus_sisaltyy && Number.isFinite(Number(r.perushinta)) ? Math.round(Number(r.perushinta) * 100) : r.unit_cents);

// ---------- Mittaus ----------

export async function varmistaEnsitilaustesti(db) {
  await db`create table if not exists ensitilaustesti (paiva date not null, versio text not null, tapahtuma text not null,
    n integer not null default 0, primary key (paiva, versio, tapahtuma))`;
  await db`alter table orders add column if not exists ensitilaus_versio text`;
  await db`alter table orders add column if not exists ensitilaus_kate numeric`;
  await db`alter table orders add column if not exists ensitilaus_alennus numeric(10,2)`;
}

/** Selaimen tapahtuma (api/sahkoposti.js action "ensitilaus", botit ja oma liikenne pois ennen tätä). */
export async function kirjaaEnsitilaustesti(db, body) {
  const tapahtuma = String(body?.tapahtuma || "");
  if (!ENSITILAUSTESTI_TAPAHTUMAT.includes(tapahtuma) || !ENSITILAUSTESTI_VERSIOT.includes(body?.versio)) return false;
  await varmistaEnsitilaustesti(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into ensitilaustesti (paiva, versio, tapahtuma, n) values (${paiva}::date, ${body.versio}, ${tapahtuma}, 1)
    on conflict (paiva, versio, tapahtuma) do update set n = ensitilaustesti.n + 1`;
  return true;
}

/** Kassalla luodun tilauksen versio, arvioitu nettokate (kassa.js laskettuNettokate) ja annettu alennus. */
export async function merkitseEnsitilaus(db, tilausId, versio, kate, alennus = 0) {
  if (!ENSITILAUSTESTI_VERSIOT.includes(versio)) return;
  await varmistaEnsitilaustesti(db);
  await db`update orders set ensitilaus_versio = ${versio}, ensitilaus_kate = ${Number.isFinite(kate) ? Math.round(kate * 100) / 100 : null},
    ensitilaus_alennus = ${Math.round((Number(alennus) || 0) * 100) / 100} where id = ${tilausId}`;
}

/** Sama kooste ja päätössääntö kuin hintatestissä (api/_lib/toimitustesti.js koostaToimitustesti). */
export const koostaEnsitilaustesti = (rivit, ostot, min = ENSITILAUSTESTI_MIN_KATSELUT) => koostaToimitustesti(rivit, ostot, min);

export async function ensitilaustestiValilla(db, alku = ENSITILAUSTESTI_ALKAEN, loppu = null) {
  await varmistaEnsitilaustesti(db);
  const l = loppu || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  const rivit = await db`select versio, tapahtuma, sum(n)::int as n from ensitilaustesti where paiva between ${alku}::date and ${l}::date group by 1, 2`;
  const ostot = await db`select ensitilaus_versio as versio, count(*)::int as n, coalesce(sum(ensitilaus_kate), 0)::float as kate,
      count(*) filter (where ensitilaus_alennus > 0)::int as alennettu, coalesce(sum(ensitilaus_alennus), 0)::float as alennus from orders
    where ensitilaus_versio is not null and paid_at is not null
      and (paid_at at time zone 'Europe/Helsinki')::date between ${alku}::date and ${l}::date group by 1`;
  const k = koostaEnsitilaustesti(rivit, ostot);
  for (const o of ostot) if (k[o.versio]) { k[o.versio].alennettu = Number(o.alennettu) || 0; k[o.versio].alennus = Math.round((Number(o.alennus) || 0) * 100) / 100; }
  return { alku, loppu: l, ...k };
}

/** Päivän yhteenvedon ja raportin rivit. */
export function ensitilaustestiRivit(s) {
  if (!s) return [];
  const e = (x) => x.toFixed(2).replace(".", ",");
  const rivi = (x, nimi) => `${nimi}: ${x.kaynti} käyntiä, ${x.tuotesivu} tuotesivua, koriin ${x.kori} (${x.koriPros ?? "-"} %), kassalle ${x.kassa} (${x.kassaPros ?? "-"} %), ostoja ${x.ostot} (${x.ostoPros ?? "-"} % käynneistä), kate ${e(x.kate)} €, kate per käynti ${x.katePerKaynti ?? "-"} €`;
  return [
    `Ensimmäisen tilauksen −${ENSITILAUS_PROSENTTI} % -testi ${s.alku}–${s.loppu}: ${s.paatos}.`,
    `  ${rivi(s.a, "A (ei merkkiä)")}`,
    `  ${rivi(s.b, `B (Ensimmäinen tilaus: −${ENSITILAUS_PROSENTTI} %)`)}${s.b.alennettu ? `, alennus ${s.b.alennettu} tilauksessa yhteensä ${e(s.b.alennus || 0)} €` : ""}`,
  ];
}

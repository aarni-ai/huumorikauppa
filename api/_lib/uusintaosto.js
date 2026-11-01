/**
 * Uudelleenostot (2.11.2026):
 *  - KIITOS-xxxxxx: 10 % seuraavaan tilaukseen, voimassa 60 päivää, sama sähköposti, kerran.
 *  - YSTAVA-xxxxxx: ostajan jaettava ystäväkoodi; ystävä saa 5 % (ei ostajan omalla sähköpostilla). Kun ystävän tilaus
 *    on maksettu, ostaja saa PALKKIO-xxxxxx: 5 % seuraavaan tilaukseen, voimassa 60 päivää (enintään 5 palkkiota).
 * Kaikkia koskee kassan katesääntö: alennus annetaan vain, jos tilauksen kate jää vähintään 7 €:oon
 * (api/_lib/kassa.js, api/_lib/vakiot.js TILAUKSEN_MIN_KATE_EUROA). Koodit luodaan maksun jälkeen (tilaus.js
 * jalkikasittely), näytetään kiitossivulla (api/order.js) ja tilausvahvistuksessa (sahkoposti.js vahvistusViesti).
 */
import { randomInt } from "node:crypto";

export const UUSINTA = { kiitos: { prosentti: 10, paivia: 60 }, ystava: { prosentti: 5 }, palkkio: { prosentti: 5, paivia: 60, enintaan: 5 } };
const AAKKOSTO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const satunnainen = (n = 6) => Array.from({ length: n }, () => AAKKOSTO[randomInt(32)]).join("");
export const ASIAKASKOODI = /^(KIITOS|YSTAVA|PALKKIO)-[A-Z2-9]{6}$/;
const email = (e) => String(e || "").trim().toLowerCase();

export async function varmistaAsiakaskoodit(db) {
  await db`create table if not exists asiakaskoodit (koodi text primary key, tyyppi text not null, prosentti numeric(5,2) not null,
    order_id uuid, email text, voimassa timestamptz, kaytetty_order_id uuid, kaytetty timestamptz, created_at timestamptz not null default now())`;
  await db`alter table asiakaskoodit add column if not exists lahde_order_id uuid`;
}

async function luo(db, tyyppi, prosentti, { orderId = null, sahkoposti = null, paivia = null }) {
  for (let i = 0; i < 5; i++) {
    const koodi = `${tyyppi.toUpperCase()}-${satunnainen()}`;
    const r = await db`insert into asiakaskoodit (koodi, tyyppi, prosentti, order_id, email, voimassa)
      values (${koodi}, ${tyyppi}, ${prosentti}, ${orderId}, ${sahkoposti}, ${paivia ? db`now() + ${`${paivia} days`}::interval` : null})
      on conflict do nothing returning koodi, prosentti, voimassa`;
    if (r.length) return r[0];
  }
  throw new Error("asiakaskoodin luonti epäonnistui");
}

/** Maksetun tilauksen kiitos- ja ystäväkoodi (idempotentti: tilausta kohden yksi kumpaakin). Ei lahjakorttitilauksille. */
export async function tilauksenAsiakaskoodit(db, tilaus) {
  await varmistaAsiakaskoodit(db);
  if ((tilaus.items || []).every((i) => i.type === "giftcard")) return {};
  const olemassa = await db`select koodi, tyyppi, prosentti, voimassa from asiakaskoodit where order_id = ${tilaus.id} and tyyppi in ('kiitos', 'ystava')`;
  const kiitos = olemassa.find((k) => k.tyyppi === "kiitos")
    || await luo(db, "kiitos", UUSINTA.kiitos.prosentti, { orderId: tilaus.id, sahkoposti: email(tilaus.customer_email), paivia: UUSINTA.kiitos.paivia });
  const ystava = olemassa.find((k) => k.tyyppi === "ystava")
    || await luo(db, "ystava", UUSINTA.ystava.prosentti, { orderId: tilaus.id, sahkoposti: email(tilaus.customer_email) });
  return { kiitos, ystava };
}

/**
 * Kassan tarkistus: { type: "percent", value } tai { virhe }. null = ei asiakaskoodi.
 */
export async function tarkistaAsiakaskoodi(db, koodi, ostajanEmail) {
  const k = String(koodi || "").trim().toUpperCase();
  if (!ASIAKASKOODI.test(k)) return null;
  await varmistaAsiakaskoodit(db);
  const [r] = await db`select * from asiakaskoodit where koodi = ${k}`;
  if (!r) return { virhe: "Koodia ei löytynyt." };
  if (r.voimassa && new Date(r.voimassa).getTime() < Date.now()) return { virhe: "Koodi on vanhentunut." };
  if (r.tyyppi === "ystava") {
    if (email(ostajanEmail) && email(ostajanEmail) === r.email) return { virhe: "Ystäväkoodi on tarkoitettu ystävällesi. Käytä omaa kiitoskoodiasi." };
    return { type: "percent", value: Number(r.prosentti) };
  }
  if (r.kaytetty) return { virhe: "Koodi on jo käytetty." };
  if (r.email && email(ostajanEmail) && r.email !== email(ostajanEmail)) return { virhe: "Koodi toimii samalla sähköpostiosoitteella kuin tilaus, josta sen sait." };
  return { type: "percent", value: Number(r.prosentti) };
}

/**
 * Maksun jälkeen: kiitos- ja palkkiokoodi merkitään käytetyksi; ystäväkoodin käytöstä ostaja saa palkkiokoodin.
 * Palauttaa luodun palkkion { koodi, email } tai null.
 */
export async function kirjaaAsiakaskoodinKaytto(db, tilaus) {
  const k = String(tilaus.discount_code || "").trim().toUpperCase();
  if (!ASIAKASKOODI.test(k)) return null;
  await varmistaAsiakaskoodit(db);
  const [r] = await db`select * from asiakaskoodit where koodi = ${k}`;
  if (!r) return null;
  if (r.tyyppi !== "ystava") {
    await db`update asiakaskoodit set kaytetty = now(), kaytetty_order_id = ${tilaus.id} where koodi = ${k} and kaytetty is null`;
    return null;
  }
  const [{ n }] = await db`select count(*)::int as n from asiakaskoodit where tyyppi = 'palkkio' and order_id = ${r.order_id}`;
  const [jo] = await db`select 1 from asiakaskoodit where tyyppi = 'palkkio' and lahde_order_id = ${tilaus.id}`;
  if (jo || n >= UUSINTA.palkkio.enintaan || !r.email) return null;
  const p = await luo(db, "palkkio", UUSINTA.palkkio.prosentti, { orderId: r.order_id, sahkoposti: r.email, paivia: UUSINTA.palkkio.paivia });
  await db`update asiakaskoodit set lahde_order_id = ${tilaus.id} where koodi = ${p.koodi}`;
  return { koodi: p.koodi, email: r.email, voimassa: p.voimassa };
}

/** Ystävälinkki: huumorikauppa.fi/ystava/<koodi> (src/pages/FriendLandingPage.tsx tallentaa koodin kassalle). */
export const ystavaLinkki = (koodi, pohja = "https://huumorikauppa.fi") => `${pohja.replace(/\/$/, "")}/ystava/${koodi}`;

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

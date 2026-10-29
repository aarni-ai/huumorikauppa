/**
 * Kumppanuusohjelman puhtaat apurit (palvelin ja selain). Asetukset api/_lib/vakiot.js KUMPPANUUS ja KUMPPANIT.
 * Seuranta: kassa kirjaa tilaukselle tapahtuman "kumppani" ({ koodi }) order_events-tauluun, joten tietokantaan ei
 * tarvita uutta saraketta. Raportti: api/cron/tilaukset.js ?tehtava=kumppanit.
 */
import { KUMPPANUUS, KUMPPANIT } from "./vakiot.js";

export const KUMPPANIKOODI = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Normalisoitu, hyväksytty kumppanikoodi tai null (ohjelma pois päältä, tuntematon tai virheellinen koodi). */
export function kumppaniKoodi(arvo, { asetukset = KUMPPANUUS, kumppanit = KUMPPANIT } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = String(arvo ?? "").trim().toLowerCase();
  return KUMPPANIKOODI.test(k) && Object.prototype.hasOwnProperty.call(kumppanit, k) ? k : null;
}

/**
 * Provisio euroina: prosentti tuotteiden arvosta ilman ALV:tä (25,5 %), enintään niin paljon, että tilauksen
 * nettokatteesta jää minKateEuroa. tuotteet = tuotteiden summa alennusten jälkeen (sis. ALV), nettokate euroina.
 */
export function provisio(tuotteet, nettokate, asetukset = KUMPPANUUS) {
  const p = (Number(tuotteet) / 1.255) * (asetukset.provisioProsentti / 100);
  const katto = Number.isFinite(nettokate) ? Math.max(0, nettokate - asetukset.minKateEuroa) : p;
  return Math.round(Math.max(0, Math.min(p, katto)) * 100) / 100;
}

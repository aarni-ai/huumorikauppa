/**
 * Kate kappaleelta -sääntö ("7 € katesääntö"). Alennus tai alennusporras annetaan vain, jos nettokate alennuksen
 * jälkeen on vähintään MIN_KATE_PER_KPL (7 €) jokaista tilauksen kappaletta kohden; muuten suurin porras, jolla raja
 * täyttyy, tai ei alennusta. Puhdas moduuli (selain ja palvelin).
 *
 * Käyttäjät:
 * - tarjouksen hinta-arvio (api/_lib/yritysmyynti.js laskeTarjous, 3.11.2026),
 * - kassan määräalennus t-paidoille, myös meemipaidoille (api/_lib/korialennus.js, omistajan päätös 4.11.2026),
 * - ensimmäisen tilauksen -5 % (api/_lib/ensitilaus.js, A/B-testi 5.11.2026) ja TERVE-koodi (api/_lib/kassa.js).
 */
import { TILAUKSEN_MIN_KATE_EUROA } from "./vakiot.js";

export const MIN_KATE_PER_KPL = TILAUKSEN_MIN_KATE_EUROA;

/** Nettokate kappaletta kohden; tuntematon kate tai 0 kpl = -Infinity (ei koskaan riitä). */
export const katePerKpl = (nettokate, kpl) => (kpl > 0 && Number.isFinite(Number(nettokate)) && nettokate !== null ? Number(nettokate) / kpl : -Infinity);

/** Riittääkö tilauksen nettokate (sentteinä pyöristetty, kate.js) kappaletta kohden. */
export const riittaaPerKpl = (nettokate, kpl, min = MIN_KATE_PER_KPL) => katePerKpl(nettokate, kpl) >= min;

/**
 * Suurin alennusprosentti, jolla kate kappaleelta on vähintään min.
 * @param prosentit ehdokkaat (esim. määräalennuksen portaat, joiden kappaleraja täyttyy)
 * @param kateKappaleelta (prosentti) -> nettokate per kpl alennuksen jälkeen, tai null/NaN kun kulua ei tunneta
 * Palauttaa prosentin tai null (ei mikään porras).
 */
export function suurinSallittuAlennus(prosentit, kateKappaleelta, min = MIN_KATE_PER_KPL) {
  const ehdokkaat = [...new Set(prosentit.map(Number).filter((p) => p > 0))].sort((a, b) => b - a);
  for (const p of ehdokkaat) {
    const k = kateKappaleelta(p);
    if (k !== null && Number.isFinite(Number(k)) && Number(k) >= min) return p;
  }
  return null;
}

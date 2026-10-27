/**
 * Printify Premium -laskelma (päivän yhteenveto, scripts/tilauskatteet.mjs): 34,99 €/kk, 20 % alennus vain tuotekulusta
 * (Printifyn total_price), ei toimituksesta eikä verosta. Suositus, kun 30 päivän bruttoalennus ylittää 35 €.
 */
export const PREMIUM_HINTA = 34.99;
export const PREMIUM_ALENNUS = 0.2;
export const PREMIUM_SUOSITUSRAJA = 35;
const r2 = (x) => Math.round(x * 100) / 100;
const eur = (x) => `${r2(x).toFixed(2).replace(".", ",")} €`;

/** tuotekulut = 30 päivän tilausten Printify total_price -summa euroina. */
export function premiumSaasto(tuotekulut) {
  const alennus = r2(PREMIUM_ALENNUS * (Number(tuotekulut) || 0));
  const netto = r2(alennus - PREMIUM_HINTA);
  return { tuotekulut: r2(Number(tuotekulut) || 0), alennus, netto, suositus: alennus > PREMIUM_SUOSITUSRAJA };
}

/** Yhteenvedon rivit. kpl = tilauksia, joiden tuotekulu tiedossa / kaikki. */
export function premiumRivit(s, { tunnettu = null, kaikki = null } = {}) {
  const kattavuus = tunnettu != null && kaikki != null ? `, tuotekulu tiedossa ${tunnettu}/${kaikki} tilauksesta` : "";
  return [
    `Printify Premium (34,99 €/kk, -20 % tuotekulusta), edelliset 30 pv: tuotekulut ${eur(s.tuotekulut)}${kattavuus}, alennus brutto ${eur(s.alennus)}, nettosäästö ${eur(s.netto)}`,
    ...(s.suositus ? [`Suositus: ota Printify Premium käyttöön (säästö ${eur(s.netto)} / 30 pv)`] : []),
  ];
}

/**
 * Maksutavat ja niiden kulut (3.11.2026, Stripen hinnasto Suomi, stripe.com/fi/pricing/local-payment-methods):
 *   card       1,5 % + 0,25 € (ETA-kortti; Apple Pay ja Google Pay ovat korttimaksuja, sama hinta)
 *   mobilepay  1,5 % + 0,36 €
 *   klarna     2,99 % + 0,40 €
 * Stripen oletuskonfiguraatiossa kaikki ovat päällä (?tehtava=maksutavat). Kortti ja MobilePay ovat aina mukana:
 * kassan katesäännöt lasketaan kortin kululla, ja MobilePay näytetään Aarnin päätöksellä 3.11.2026 myös yhden 24,90 €:n
 * t-paidan tilauksessa (kate 6,94 €, poikkeama enintään 0,06 €). Klarna tarjotaan vain, kun tilauksen nettokate on
 * vähintään TILAUKSEN_MIN_KATE_EUROA (7 €) Klarnan kululla. Kun kaikki tavat kelpaavat, istunto käyttää Stripen
 * dynaamisia maksutapoja (payment_method_types puuttuu). KATTEET.md "Maksutavat ja 7 €:n kate 3.11.2026".
 */
import { TILAUKSEN_MIN_KATE_EUROA } from "./vakiot.js";

export const MAKSUTAPAKULUT = {
  card: { prosentti: 0.015, kiintea: 0.25 },
  mobilepay: { prosentti: 0.015, kiintea: 0.36 },
  klarna: { prosentti: 0.0299, kiintea: 0.4 },
};
export const MAKSUTAVAT_JARJESTYS = ["card", "mobilepay", "klarna"];
/** Aina tarjottavat maksutavat; muut rajataan 7 €:n katteella. */
export const AINA_SALLITUT = ["card", "mobilepay"];
/** MobilePayn sallittu poikkeama 7 €:n katteesta (pahin tapaus 6,94 €). */
export const MOBILEPAY_POIKKEAMA_EUROA = 0.06;

/**
 * Sallitut maksutavat. nettokateKulula({ prosentti, kiintea }) -> nettokate (NaN = tuntematon). Palauttaa
 * { tavat: ["card", ...], kaikki: boolean, pois: ["klarna", ...] }.
 */
export function sallitutMaksutavat(nettokateKulula, raja = TILAUKSEN_MIN_KATE_EUROA) {
  const tavat = MAKSUTAVAT_JARJESTYS.filter((t) => AINA_SALLITUT.includes(t) || nettokateKulula(MAKSUTAPAKULUT[t]) >= raja);
  return { tavat, kaikki: tavat.length === MAKSUTAVAT_JARJESTYS.length, pois: MAKSUTAVAT_JARJESTYS.filter((t) => !tavat.includes(t)) };
}

/** Checkout-istunnon parametri: tyhjä (dynaamiset maksutavat), kun kaikki kelpaavat; muuten payment_method_types. */
export const istunnonMaksutavat = (s) => (s.kaikki ? {} : { payment_method_types: s.tavat });

/** Ryhmätilaukset (9 €/paita): Klarnalla 50+ portaan kate jäisi 8,64 €:oon, joten istunnoissa kortti ja MobilePay. */
export const RYHMA_MAKSUTAVAT = ["card", "mobilepay"];

/**
 * Katesääntö (21.10.2026): myynti estetään, jos tuotteen nettokate on alle 40 %.
 *
 *   myynti alv 0   = (myyntihinta + asiakkaan toimitusmaksu) / 1,255
 *   nettokate      = myynti alv 0 - Printifyn tuotekulu - Printifyn toimituskulu - Stripe (1,5 % + 0,25 € maksetusta)
 *   kate %         = nettokate / myynti alv 0
 *
 * Laskenta yhden kappaleen tilauksena (pahin tapaus: toimitusmaksu 6,90 € alle 79 €:n tilauksissa, Printifyn
 * ensimmäisen kappaleen toimituskulu). Printifyn kulut ovat tuoterivillä (variants.costs: variant_id -> sentit,
 * variants.shipping_cents: Suomen toimitus ensimmäiselle kappaleelle), ja ne haetaan Printifystä
 * (scripts/printify-tuonti.mjs --kulut). Tuntematon kulu: tuotetta ei voi ostaa (kassa), mutta se näkyy listassa,
 * kunnes kulut on tuotu.
 */
export const ALV = 0.255;
export const KATE_RAJA = 0.4;
export const STRIPE_PROSENTTI = 0.015;
export const STRIPE_KIINTEA = 0.25;
export const TOIMITUSMAKSU = 6.9;
export const ILMAINEN_RAJA = 79;

/** Tuotteen variantin kate. Palauttaa { tunnettu, nettokate, kate, sallittu }. */
export function laskeKate(tuote, varianttiId = null) {
  const hinta = Number(tuote?.price);
  const kulut = tuote?.variants?.costs || {};
  const toimitus = tuote?.variants?.shipping_cents;
  const id = varianttiId ?? Object.values(tuote?.variants?.variant_map || {})[0];
  const kulu = kulut[String(id)];
  if (!Number.isFinite(hinta) || typeof kulu !== "number" || typeof toimitus !== "number") {
    return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  }
  const toimitusmaksu = hinta >= ILMAINEN_RAJA ? 0 : TOIMITUSMAKSU;
  const maksettu = hinta + toimitusmaksu;
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulu / 100 - toimitus / 100 - stripe;
  const kate = nettokate / myyntiAlv0;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= KATE_RAJA };
}

/** Tuotteen kaikkien varianttien heikoin kate (listanäkymä: piilotetaan, jos jokin tunnettu variantti on alle rajan). */
export function heikoinKate(tuote) {
  const idt = Object.values(tuote?.variants?.variant_map || {});
  const tulokset = idt.map((id) => laskeKate(tuote, id)).filter((k) => k.tunnettu);
  if (!tulokset.length) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  return tulokset.reduce((a, b) => (b.kate < a.kate ? b : a));
}

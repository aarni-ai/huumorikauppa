/**
 * Katesääntö (26.10.2026): myynti estetään vain, jos tuotteen nettokate on alle 20 % (KATE_RAJA). Alennukset
 * (pakettialennus, ensitilauksen koodi) sallitaan vain, jos kate alennuksen jälkeen on vähintään 30 %
 * (PAKETTI_KATE_RAJA, ALENNUS_KATE_RAJA). Uusien tuotteiden hinnoittelun tavoite on edelleen 40 % (HINNOITTELU_KATE).
 *
 *   myynti alv 0   = (myyntihinta + asiakkaan toimitusmaksu) / 1,255
 *   nettokate      = myynti alv 0 - Printifyn tuotekulu - Printifyn toimituskulu - Stripe (1,5 % + 0,25 € maksetusta)
 *   kate %         = nettokate / myynti alv 0
 *
 * Laskenta yhden kappaleen tilauksena (pahin tapaus: toimitusmaksu (vakiot.js) rajan alle jäävissä tilauksissa, Printifyn
 * ensimmäisen kappaleen toimituskulu). Printifyn kulut ovat tuoterivillä (variants.costs: variant_id -> sentit,
 * variants.shipping_cents: Suomen toimitus ensimmäiselle kappaleelle), ja ne haetaan Printifystä
 * (scripts/printify-tuonti.mjs --kulut). Tuntematon kulu: tuotetta ei voi ostaa (kassa), mutta se näkyy listassa,
 * kunnes kulut on tuotu.
 */
export const ALV = 0.255;
/** Myynnin raja: alle tämän tuotetta ei voi ostaa (kassa) eikä se näy listoissa. */
export const KATE_RAJA = 0.2;
/** Pakettialennus annetaan vain, jos paketin kate alennuksen jälkeen on vähintään tämä. */
export const PAKETTI_KATE_RAJA = 0.3;
/** Muut alennukset (ensitilauksen koodi): tilauksen kate alennuksen jälkeen vähintään tämä. */
export const ALENNUS_KATE_RAJA = 0.3;
/** Uusien tuotteiden hinnoittelun tavoite (scripts/lib/uudet-tuotteet.mjs), ei myynnin raja. */
export const HINNOITTELU_KATE = 0.4;
export const STRIPE_PROSENTTI = 0.015;
export const STRIPE_KIINTEA = 0.25;
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "./vakiot.js";

export const TOIMITUSMAKSU = TOIMITUS;
export const ILMAINEN_RAJA = ILMAINEN_TOIMITUS_RAJA;

/**
 * Tuotteen variantin kate. Palauttaa { tunnettu, nettokate, kate, sallittu }.
 * asetukset: { toimitusmaksu, ilmainenRaja, raja } (oletus: api/_lib/vakiot.js, raja KATE_RAJA); uusien tuotteiden
 * hinnoittelu (scripts/printify-uudet-tuotteet.mjs) laskee suunnitellulla toimitusmaksulla ja rajalla HINNOITTELU_KATE.
 */
export function laskeKate(tuote, varianttiId = null, { toimitusmaksu: maksu = TOIMITUSMAKSU, ilmainenRaja = ILMAINEN_RAJA, raja = KATE_RAJA } = {}) {
  const hinta = Number(tuote?.price);
  const kulut = tuote?.variants?.costs || {};
  const toimitus = tuote?.variants?.shipping_cents;
  const id = varianttiId ?? Object.values(tuote?.variants?.variant_map || {})[0];
  const kulu = kulut[String(id)];
  if (!Number.isFinite(hinta) || typeof kulu !== "number" || typeof toimitus !== "number") {
    return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  }
  const toimitusmaksu = hinta >= ilmainenRaja ? 0 : maksu;
  const maksettu = hinta + toimitusmaksu;
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulu / 100 - toimitus / 100 - stripe;
  const kate = nettokate / myyntiAlv0;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= raja };
}

/** Tuotteen kaikkien varianttien heikoin kate (listanäkymä: piilotetaan, jos jokin tunnettu variantti on alle rajan). */
export function heikoinKate(tuote) {
  const idt = Object.values(tuote?.variants?.variant_map || {});
  const tulokset = idt.map((id) => laskeKate(tuote, id)).filter((k) => k.tunnettu);
  if (!tulokset.length) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  return tulokset.reduce((a, b) => (b.kate < a.kate ? b : a));
}

/**
 * Paketin (useampi tuote yhdessä tilauksessa, pakettialennus) kate samalla kaavalla. Pahin tapaus: paketti on
 * tilauksen ainoa sisältö, toimitusmaksu peritään alennusta edeltävän summan mukaan (kuten kassa), ja Printifyn
 * toimituskulu lasketaan jokaiselle tuotteelle ensimmäisen kappaleen hinnalla (lisäkappaleen hintaa ei tunneta).
 * @param osat [{ tuote, varianttiId }]
 * @param alennusProsentti esim. 10
 * Palauttaa { tunnettu, nettokate, kate, sallittu }; sallittu = kate >= PAKETTI_KATE_RAJA (30 %).
 * Tuntematon kulu: tunnettu false, sallittu null.
 */
export function laskePaketinKate(osat, alennusProsentti = 0) {
  if (!Array.isArray(osat) || osat.length === 0) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  let hinnat = 0;
  let kulut = 0;
  for (const { tuote, varianttiId } of osat) {
    const hinta = Number(tuote?.price);
    const id = varianttiId ?? Object.values(tuote?.variants?.variant_map || {})[0];
    const kulu = (tuote?.variants?.costs || {})[String(id)];
    const toimitus = tuote?.variants?.shipping_cents;
    if (!Number.isFinite(hinta) || typeof kulu !== "number" || typeof toimitus !== "number") {
      return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
    }
    hinnat += hinta;
    kulut += (kulu + toimitus) / 100;
  }
  const toimitusmaksu = hinnat >= ILMAINEN_RAJA ? 0 : TOIMITUSMAKSU;
  const maksettu = hinnat * (1 - alennusProsentti / 100) + toimitusmaksu;
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulut - stripe;
  const kate = nettokate / myyntiAlv0;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= PAKETTI_KATE_RAJA };
}

/** Paketin heikoin kate kaikilla varianttiyhdistelmillä (näyttö: alennus luvataan vain, jos jokainen yhdistelmä täyttää säännön). */
export function paketinHeikoinKate(tuotteet, alennusProsentti = 0) {
  const listat = tuotteet.map((t) => {
    const idt = Object.values(t?.variants?.variant_map || {});
    return idt.length ? idt : [null];
  });
  let heikoin = null;
  const kayLapi = (i, valitut) => {
    if (i === tuotteet.length) {
      const k = laskePaketinKate(valitut, alennusProsentti);
      if (!k.tunnettu) heikoin = { tunnettu: false, nettokate: null, kate: null, sallittu: null };
      else if (heikoin?.tunnettu !== false && (!heikoin || k.kate < heikoin.kate)) heikoin = k;
      return;
    }
    for (const id of listat[i]) {
      if (heikoin?.tunnettu === false) return;
      kayLapi(i + 1, [...valitut, { tuote: tuotteet[i], varianttiId: id }]);
    }
  };
  kayLapi(0, []);
  return heikoin || { tunnettu: false, nettokate: null, kate: null, sallittu: null };
}

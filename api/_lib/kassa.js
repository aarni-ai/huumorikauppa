/**
 * Kassan laskenta (puhdas, testattava). Samat säännöt kuin vanhassa create-checkoutissa: hinta palvelimelta,
 * toimitus 6,90 € alle 79 €:n tilauksiin, prosentti- tai euroalennus. Uutta: tuote, jonka Printify-varianttia
 * ei löydy, tai myynnistä piilotettu tuote hylätään ennen maksua.
 */
import { myynnissa, printifyVariantti } from "./tuotteet.js";
import { laskeKate } from "./kate.js";

export const ILMAINEN_TOIMITUS_RAJA = 79;
export const TOIMITUS = 6.9;
/** Koodit, jos tietokantaa ei ole (samat kuin kassasivulla). Tietokannan discount_codes ohittaa nämä. */
export const OLETUSKOODIT = { HUUMORI5: { type: "percent", value: 5 }, PALAA10: { type: "percent", value: 10 } };

const sentit = (x) => Math.round(x * 100);

export class KassaVirhe extends Error {
  constructor(viesti, vaihe) {
    super(viesti);
    this.vaihe = vaihe;
  }
}

/**
 * @param pyynto { items, customerEmail, customerName, shippingAddress, recipientName, discountCode }
 * @param tuotteet kaikki tuoterivit
 * @param alennus { type, value } tai null
 */
export function laskeTilaus(pyynto, tuotteet, alennus) {
  const { items, customerEmail, shippingAddress } = pyynto || {};
  if (!Array.isArray(items) || items.length === 0) throw new KassaVirhe("Ostoskori on tyhjä.", "missing_items");
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new KassaVirhe("Sähköpostiosoite puuttuu tai on virheellinen.", "missing_email");
  if (!shippingAddress?.address || !shippingAddress?.zip || !shippingAddress?.city) throw new KassaVirhe("Toimitusosoite puuttuu.", "missing_address");
  const byId = new Map(tuotteet.map((p) => [p.id, p]));
  const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
  const rivit = items.map((it) => {
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) throw new KassaVirhe("Virheellinen määrä.", "invalid_quantity");
    const p = (it.id && byId.get(it.id)) || (it.slug && bySlug.get(it.slug));
    if (!p) throw new KassaVirhe(`Tuotetta ei löydy: ${it.name || it.slug}`, "unknown_product");
    if (!myynnissa(p)) throw new KassaVirhe(`Tuote ei ole enää myynnissä: ${p.name}`, "hidden_category");
    const hinta = Number(p.price);
    if (!Number.isFinite(hinta) || hinta <= 0) throw new KassaVirhe(`Tuotteen hintaa ei voitu vahvistaa: ${p.name}`, "unknown_product_price");
    const variantti = printifyVariantti(p, it.color, it.size);
    if (!p.printify_product_id || variantti === null) {
      throw new KassaVirhe(`Valitse koko ja väri uudelleen tuotteelle ${p.name}. Tätä vaihtoehtoa ei voi nyt tilata.`, "missing_variant");
    }
    // Katesääntö: alle 40 % tai tuntematon Printify-kulu -> ei maksua.
    const kate = laskeKate(p, variantti);
    if (!kate.tunnettu) throw new KassaVirhe(`Tuotteen ${p.name} hintaa ei voitu vahvistaa. Yritä hetken kuluttua uudelleen.`, "unknown_cost");
    if (!kate.sallittu) throw new KassaVirhe(`Tuote ${p.name} ei ole tällä hetkellä tilattavissa.`, "low_margin");
    return {
      product_id: p.id, slug: p.slug, name: p.name, size: it.size || null, color: it.color || null,
      custom_text: typeof it.customText === "string" && it.customText.trim() ? it.customText.trim().slice(0, 200) : null,
      image: typeof it.image === "string" && /^https?:\/\//.test(it.image) ? it.image : null,
      quantity: it.quantity, unit_price: hinta, printify_product_id: p.printify_product_id, variant_id: variantti,
    };
  });
  const valisumma = rivit.reduce((s, r) => s + r.unit_price * r.quantity, 0);
  const prosentti = alennus?.type === "percent" ? alennus.value : 0;
  const euroa = alennus?.type === "fixed" ? alennus.value : 0;
  const suhde = valisumma > 0 ? Math.max(0, valisumma - euroa) / valisumma : 1;
  const toimitus = valisumma >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS;
  // Rivikohtainen hinta sentteinä kuten Stripe veloittaa.
  const stripeRivit = rivit.map((r) => ({ ...r, unit_cents: Math.max(0, Math.round(sentit(r.unit_price) * (1 - prosentti / 100) * suhde)) }));
  const tuotteetYht = stripeRivit.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const total = Math.round((tuotteetYht + toimitus) * 100) / 100;
  return {
    rivit: stripeRivit,
    subtotal: Math.round(valisumma * 100) / 100,
    shipping: toimitus,
    discount: Math.round((valisumma - tuotteetYht) * 100) / 100,
    total,
  };
}

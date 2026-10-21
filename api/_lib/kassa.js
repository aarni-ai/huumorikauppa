/**
 * Kassan laskenta (puhdas, testattava). Samat säännöt kuin vanhassa create-checkoutissa: hinta palvelimelta,
 * toimitus 6,90 € alle 79 €:n tilauksiin, prosentti- tai euroalennus. Uutta: tuote, jonka Printify-varianttia
 * ei löydy, tai myynnistä piilotettu tuote hylätään ennen maksua.
 *
 * Lisäksi (kasvu-oma-tausta):
 * - Lahjakortit (type "giftcard", api/_lib/lahjakortti.js): ei Printifyä, ei katesääntöä, ei toimitusmaksua, eivät
 *   kerrytä ilmaisen toimituksen rajaa eikä alennuskoodi koske niitä. Pelkkä lahjakorttitilaus ei vaadi osoitetta.
 * - Pakettialennus (api/_lib/paketit.js): kun paketin molemmat tuotteet ovat korissa eikä alennuskoodia käytetä,
 *   ja vain jos paketin kate alennuksen jälkeen on vähintään 40 %.
 * - Lahjakortilla maksu: tarkistettu saldo vähennetään maksettavasta (lahjakortti { koodi, saldo }).
 */
import { myynnissa, printifyVariantti } from "./tuotteet.js";
import { laskeKate } from "./kate.js";
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "./vakiot.js";
import { sovellaPaketit } from "./paketit.js";
import { lahjakorttiTuote, onLahjakortti, kaytettavaSumma } from "./lahjakortti.js";

export { ILMAINEN_TOIMITUS_RAJA, TOIMITUS };
/** Koodit, jos tietokantaa ei ole (samat kuin kassasivulla). Tietokannan discount_codes ohittaa nämä. */
export const OLETUSKOODIT = { HUUMORI5: { type: "percent", value: 5 }, PALAA10: { type: "percent", value: 10 } };

const sentit = (x) => Math.round(x * 100);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);

export class KassaVirhe extends Error {
  constructor(viesti, vaihe) {
    super(viesti);
    this.vaihe = vaihe;
  }
}

function lahjakorttiRivi(it) {
  const p = lahjakorttiTuote(String(it.id || it.slug || "").replace(/^lahjakortti-/, ""));
  if (!p) throw new KassaVirhe(`Tuntematon lahjakortti: ${it.name || it.slug}`, "unknown_product");
  const vastaanottaja = it.giftCard || {};
  const email = teksti(vastaanottaja.recipientEmail, 200);
  if (email && !EMAIL_RE.test(email)) throw new KassaVirhe("Lahjakortin saajan sähköpostiosoite on virheellinen.", "invalid_recipient_email");
  return {
    type: "giftcard",
    product_id: p.id, slug: p.slug, name: p.name, size: null, color: null, custom_text: null, image: null,
    quantity: it.quantity, unit_price: p.price, printify_product_id: null, variant_id: null,
    recipient_email: email, recipient_name: teksti(vastaanottaja.recipientName, 100), message: teksti(vastaanottaja.message, 500),
  };
}

/**
 * @param pyynto { items, customerEmail, customerName, shippingAddress, recipientName, discountCode }
 * @param tuotteet kaikki tuoterivit
 * @param alennus { type, value } tai null
 * @param lisat { paketit: pakettimääritykset, lahjakortti: { koodi, saldo } tarkistettu kortti tai null }
 */
export function laskeTilaus(pyynto, tuotteet, alennus, lisat = {}) {
  const { items, customerEmail, shippingAddress } = pyynto || {};
  if (!Array.isArray(items) || items.length === 0) throw new KassaVirhe("Ostoskori on tyhjä.", "missing_items");
  if (!customerEmail || !EMAIL_RE.test(customerEmail)) throw new KassaVirhe("Sähköpostiosoite puuttuu tai on virheellinen.", "missing_email");
  const vainLahjakortteja = items.every((it) => onLahjakortti(it));
  if (!vainLahjakortteja && (!shippingAddress?.address || !shippingAddress?.zip || !shippingAddress?.city)) {
    throw new KassaVirhe("Toimitusosoite puuttuu.", "missing_address");
  }
  const byId = new Map(tuotteet.map((p) => [p.id, p]));
  const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
  const lahjakortit = [];
  const rivit = [];
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) throw new KassaVirhe("Virheellinen määrä.", "invalid_quantity");
    if (onLahjakortti(it)) {
      lahjakortit.push(lahjakorttiRivi(it));
      continue;
    }
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
    rivit.push({
      product_id: p.id, slug: p.slug, name: p.name, size: it.size || null, color: it.color || null,
      custom_text: teksti(it.customText, 200),
      image: typeof it.image === "string" && /^https?:\/\//.test(it.image) ? it.image : null,
      quantity: it.quantity, unit_price: hinta, printify_product_id: p.printify_product_id, variant_id: variantti,
    });
  }
  if (lisat.lahjakortti && lahjakortit.length) {
    throw new KassaVirhe("Lahjakortilla ei voi ostaa lahjakortteja. Tee lahjakortin osto erillisenä tilauksena.", "giftcard_for_giftcard");
  }

  // Fyysiset tuotteet: alennuskoodi ja toimitusmaksu kuten ennen.
  const valisumma = rivit.reduce((s, r) => s + r.unit_price * r.quantity, 0);
  const prosentti = alennus?.type === "percent" ? alennus.value : 0;
  const euroa = alennus?.type === "fixed" ? alennus.value : 0;
  const suhde = valisumma > 0 ? Math.max(0, valisumma - euroa) / valisumma : 1;
  const toimitus = rivit.length === 0 || valisumma >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS;
  // Rivikohtainen hinta sentteinä kuten Stripe veloittaa.
  let fyysiset = rivit.map((r) => ({ ...r, unit_cents: Math.max(0, Math.round(sentit(r.unit_price) * (1 - prosentti / 100) * suhde)) }));
  let pakettiAlennus = 0;
  if (!alennus && lisat.paketit?.length) {
    const p = sovellaPaketit(fyysiset, bySlug, lisat.paketit);
    fyysiset = p.rivit;
    pakettiAlennus = p.alennus;
  }
  const kortit = lahjakortit.map((r) => ({ ...r, unit_cents: sentit(r.unit_price) }));
  const stripeRivit = [...fyysiset, ...kortit];
  const tuotteetYht = fyysiset.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const korttienSumma = kortit.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const total = Math.round((tuotteetYht + korttienSumma + toimitus) * 100) / 100;
  const lahjakortilla = lisat.lahjakortti ? kaytettavaSumma(lisat.lahjakortti.saldo, total) : 0;
  return {
    rivit: stripeRivit,
    subtotal: Math.round((valisumma + korttienSumma) * 100) / 100,
    shipping: toimitus,
    discount: Math.round((valisumma - tuotteetYht) * 100) / 100,
    bundle_discount: Math.round(pakettiAlennus * 100) / 100,
    total,
    gift_card_code: lisat.lahjakortti && lahjakortilla > 0 ? lisat.lahjakortti.koodi : null,
    gift_card_amount: lahjakortilla,
    amount_due: Math.round((total - lahjakortilla) * 100) / 100,
    only_gift_cards: rivit.length === 0,
  };
}

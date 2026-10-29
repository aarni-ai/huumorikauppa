/** Printify API (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID). Kaikki kutsut palauttavat { ok, status, data, virhe }. */
import { PERSONOITU_PRINTIFY, PERSONOITU_POHJA, jasennaPersonointi } from "./personoitu.js";
import { allekirjoita } from "./markkinointi.js";
const API = "https://api.printify.com/v1";

export const onPrintify = () => !!(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID);

async function kutsu(polku, init = {}) {
  return kutsuApi(`/shops/${process.env.PRINTIFY_SHOP_ID}${polku}`, init);
}

/** Kutsu mihin tahansa Printify-polkuun (myös /catalog). aikaraja ms, oletus 25 s. */
async function kutsuApi(polku, init = {}, aikaraja = 25000, pohja = API) {
  if (!onPrintify()) return { ok: false, status: 0, data: null, virhe: "Printify-avain puuttuu (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID)" };
  try {
    const res = await fetch(`${pohja}${polku}`, {
      ...init,
      headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
      signal: AbortSignal.timeout(aikaraja),
    });
    const teksti = await res.text();
    let data = null;
    try { data = teksti ? JSON.parse(teksti) : null; } catch { /* ei JSONia */ }
    return { ok: res.ok, status: res.status, data, virhe: res.ok ? null : `Printify ${res.status}: ${teksti.slice(0, 400)}` };
  } catch (e) {
    return { ok: false, status: 0, data: null, virhe: `Printify-yhteys: ${e?.message || e}` };
  }
}

/** Kaupan tuote (variants[].is_enabled, is_available, blueprint_id, print_provider_id). */
export function haeTuote(printifyTuoteId, { aikaraja = 25000 } = {}) {
  return kutsuApi(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${encodeURIComponent(printifyTuoteId)}.json`, { method: "GET" }, aikaraja);
}

/** Painotalon katalogivariantit (myös loppuneet). Puuttuva variantti on poistunut valikoimasta. */
export function haeKatalogiVariantit(blueprintId, providerId) {
  return kutsuApi(`/catalog/blueprints/${encodeURIComponent(blueprintId)}/print_providers/${encodeURIComponent(providerId)}/variants.json?show-out-of-stock=1`, { method: "GET" });
}

/** Painotalo katalogista (title, location.country). */
export function haePainotalo(providerId) {
  return kutsuApi(`/catalog/print_providers/${encodeURIComponent(providerId)}.json`, { method: "GET" }, 10000);
}

/** Luo tilaus (Printifyssä tila on-hold, kunnes send_to_production onnistuu). */
export function luoTilaus(runko) {
  return kutsu("/orders.json", { method: "POST", body: JSON.stringify(runko) });
}

/** Lähetä tuotantoon. Tilaus on lähetetty vasta, kun tämä onnistuu. */
export function lahetaTuotantoon(printifyTilausId) {
  return kutsu(`/orders/${printifyTilausId}/send_to_production.json`, { method: "POST" });
}

/** Kaupan tuotteet sivuittain (blueprint_id, print_provider_id). */
export function listaaTuotteet(sivu = 1, maara = 50) {
  return kutsu(`/products.json?page=${sivu}&limit=${maara}`, { method: "GET" });
}

/** Printifyn ilmoittamat toimitustiedot (v2: handlingTime, shippingTime maittain), toimitustapa standard. */
export function haeToimitusajat(blueprintId, providerId) {
  return kutsuApi(`/catalog/blueprints/${encodeURIComponent(blueprintId)}/print_providers/${encodeURIComponent(providerId)}/shipping/standard.json`, { method: "GET" }, 15000, "https://api.printify.com/v2");
}

/** Kaupan tilaukset sivuittain (uusin ensin). */
export function listaaTilaukset(sivu = 1, maara = 50) {
  return kutsu(`/orders.json?page=${sivu}&limit=${maara}`, { method: "GET" });
}

export function haeTilaus(printifyTilausId) {
  return kutsu(`/orders/${printifyTilausId}.json`, { method: "GET" });
}

/** Peru tilaus (vain ennen tuotantoa: on-hold tai pending). */
export function peruTilaus(printifyTilausId) {
  return kutsu(`/orders/${printifyTilausId}/cancel.json`, { method: "POST" });
}

/** Personoidun rivin painokuvan osoite: allekirjoitettu { malli, nimi, ika, vari } (api/painokuva.js). */
export function painokuvaUrl(rivi, tilausId = "", n = 0) {
  const pers = jasennaPersonointi(rivi.custom_text);
  if (!pers.ok) throw new Error(`Personointi puuttuu tai on virheellinen (tilaus ${tilausId}, rivi ${n})`);
  const tunniste = allekirjoita("painokuva", JSON.stringify({ m: pers.malli, n: pers.nimi, i: pers.ika, v: rivi.color || "Musta" }));
  const pohja = (process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");
  return `${pohja}/api/painokuva?t=${encodeURIComponent(tunniste)}`;
}

/** Printify-tilauksen runko omasta tilausrivistä. */
export function tilausRunko(tilaus) {
  const nimi = (tilaus.recipient_name || tilaus.customer_name || "Asiakas").trim();
  const [etu, ...suku] = nimi.split(/\s+/);
  const osoite = tilaus.shipping_address || {};
  return {
    external_id: tilaus.id,
    label: `Huumorikauppa #${tilaus.id.slice(0, 8).toUpperCase()}`,
    // Lahjakortit (type "giftcard") eivät ole Printify-tuotteita.
    // Personoitu t-paita: lennosta luotava tuote, painokuva tilausriville (api/painokuva.js, allekirjoitettu osoite).
    line_items: (tilaus.items || []).filter((i) => i.type !== "giftcard").map((i, n) => (i.printify_product_id === PERSONOITU_PRINTIFY
      ? { ...PERSONOITU_POHJA, variant_id: i.variant_id, print_areas: { front: painokuvaUrl(i, tilaus.id, n) }, quantity: i.quantity }
      : { product_id: i.printify_product_id, variant_id: i.variant_id, quantity: i.quantity })),
    shipping_method: 1,
    is_printify_express: false,
    is_economy_shipping: false,
    // Oma lähetysviesti, kun sähköposti on käytössä; muuten Printify ilmoittaa asiakkaalle itse.
    send_shipping_notification: !process.env.RESEND_API_KEY,
    address_to: {
      first_name: etu || "Asiakas",
      last_name: suku.join(" ") || etu || "Asiakas",
      email: tilaus.customer_email,
      phone: osoite.phone || tilaus.phone || "",
      country: osoite.country || "FI",
      region: "",
      address1: osoite.address || "",
      address2: "",
      city: osoite.city || "",
      zip: osoite.zip || "",
    },
  };
}

/** Lähetystiedot Printify-tilauksesta (ensimmäinen lähetys, toimitettu = delivered_at, jos Printify tietää sen). */
export function lahetys(printifyTilaus) {
  const s = (printifyTilaus?.shipments || [])[0];
  if (!s) return null;
  return { carrier: s.carrier || null, numero: s.number || null, url: s.url || null, toimitettu: s.delivered_at || null };
}

/** Printify API (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID). Kaikki kutsut palauttavat { ok, status, data, virhe }. */
const API = "https://api.printify.com/v1";

export const onPrintify = () => !!(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID);

async function kutsu(polku, init = {}) {
  if (!onPrintify()) return { ok: false, status: 0, data: null, virhe: "Printify-avain puuttuu (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID)" };
  try {
    const res = await fetch(`${API}/shops/${process.env.PRINTIFY_SHOP_ID}${polku}`, {
      ...init,
      headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
      signal: AbortSignal.timeout(25000),
    });
    const teksti = await res.text();
    let data = null;
    try { data = teksti ? JSON.parse(teksti) : null; } catch { /* ei JSONia */ }
    return { ok: res.ok, status: res.status, data, virhe: res.ok ? null : `Printify ${res.status}: ${teksti.slice(0, 400)}` };
  } catch (e) {
    return { ok: false, status: 0, data: null, virhe: `Printify-yhteys: ${e?.message || e}` };
  }
}

/** Luo tilaus (Printifyssä tila on-hold, kunnes send_to_production onnistuu). */
export function luoTilaus(runko) {
  return kutsu("/orders.json", { method: "POST", body: JSON.stringify(runko) });
}

/** Lähetä tuotantoon. Tilaus on lähetetty vasta, kun tämä onnistuu. */
export function lahetaTuotantoon(printifyTilausId) {
  return kutsu(`/orders/${printifyTilausId}/send_to_production.json`, { method: "POST" });
}

export function haeTilaus(printifyTilausId) {
  return kutsu(`/orders/${printifyTilausId}.json`, { method: "GET" });
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
    line_items: (tilaus.items || []).filter((i) => i.type !== "giftcard").map((i) => ({ product_id: i.printify_product_id, variant_id: i.variant_id, quantity: i.quantity })),
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

/** Lähetystiedot Printify-tilauksesta (ensimmäinen lähetys). */
export function lahetys(printifyTilaus) {
  const s = (printifyTilaus?.shipments || [])[0];
  if (!s) return null;
  return { carrier: s.carrier || null, numero: s.number || null, url: s.url || null };
}

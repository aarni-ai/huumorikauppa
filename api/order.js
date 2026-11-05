/**
 * GET /api/order?session_id=... tilausvahvistussivulle (korvaa get-order-by-session). Jos webhook ei ole vielä
 * käsitellyt maksua, käsittelee sen tässä (sama idempotentti funktio).
 * POST /api/order { sessionId, action: "resend" } lähettää vahvistuksen uudelleen (enintään 10 min välein).
 * Lahjakortit (1.11.2026): maksetun tilauksen koodit vastauksen kentässä lahjakortit, ja
 * GET ?session_id=...&lahjakortti=HK-... palauttaa tulostettavan PDF:n (vain saman tilauksen kortti).
 */
import { onTietokanta, sql } from "./_lib/db.js";
import { onStripe, stripe } from "./_lib/stripe.js";
import { kasitteleMaksu, blobTilausVarasto } from "./_lib/tilaus.js";
import { laheta, vahvistusViesti } from "./_lib/sahkoposti.js";
import { onLahjakortti, normalisoiKoodi } from "./_lib/lahjakortti.js";
import { tilauksenLahjakortit, toimitaLahjakortit } from "./_lib/lahjakortti-db.js";
import { lahjakorttiPdf, pdfTiedostonimi } from "./_lib/lahjakortti-pdf.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Kokonaan lahjakortilla maksettu tilaus (ei Stripe-sessiota) haetaan tilauksen id:llä (?order_id=, UUID).
const haeTilaus = async (sessionId) => UUID_RE.test(sessionId)
  ? (await sql()`select * from orders where id = ${sessionId} and stripe_session_id is null and gift_card_amount > 0`)[0]
  : (await sql()`select * from orders where stripe_session_id = ${sessionId}`)[0];

/**
 * Puskuritilaus (kassa ilman tietokantaa, session metadata puskuri=1): tilaus Blobista, maksu käsitellään tässä, jos
 * webhook ei ole vielä ehtinyt. null, jos sessio ei ole puskuritilaus tai tilaus on jo siirretty kantaan.
 */
async function puskuriTilaus(sessionId) {
  // Kokonaan lahjakortilla maksettu puskuritilaus (ei Stripe-sessiota): tilauksen id.
  if (UUID_RE.test(sessionId)) {
    const t = await blobTilausVarasto().hae(sessionId).catch(() => null);
    return t && !t.stripe_session_id && Number(t.gift_card_amount) > 0 ? t : null;
  }
  if (!sessionId.startsWith("cs_") || !onStripe()) return null;
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  const id = session.metadata?.order_id;
  if (session.metadata?.puskuri !== "1" || !id) return null;
  let t = await blobTilausVarasto().hae(id);
  if (t && t.status === "odottaa_maksua" && session.payment_status === "paid") {
    await kasitteleMaksu(session);
    t = await blobTilausVarasto().hae(id);
  }
  return t;
}

export default async function handler(req, res) {
  if (!onTietokanta()) return res.status(200).json({ found: false, syy: "ei käytössä" });
  const sessionId = req.method === "GET" ? req.query.session_id || req.query.order_id : req.body?.sessionId || req.body?.orderId;
  if (!sessionId || typeof sessionId !== "string" || !(sessionId.startsWith("cs_") || UUID_RE.test(sessionId))) return res.status(400).json({ error: "session_id puuttuu" });
  let puskurista = null;
  try { puskurista = await puskuriTilaus(sessionId); } catch (e) { console.error("puskuritilaus:", e?.message || e); }
  if (puskurista) return vastaaPuskurista(req, res, puskurista);
  let tilaus = await haeTilaus(sessionId);
  if ((!tilaus || tilaus.status === "odottaa_maksua") && onStripe() && sessionId.startsWith("cs_")) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await kasitteleMaksu(session);
        tilaus = await haeTilaus(sessionId);
      }
    } catch (e) {
      console.error("order self-heal:", e?.message);
    }
  }
  if (!tilaus) return res.status(200).json({ found: false });
  // Ostetut lahjakortit: koodit luodaan maksun käsittelyssä (jalkikasittely); jos niitä ei vielä ole, luodaan tässä
  // (idempotentti). Näytetään vain maksetulle tilaukselle.
  let lahjakortit = [];
  if (tilaus.status === "maksettu" && (tilaus.items || []).some((i) => onLahjakortti(i))) {
    lahjakortit = await tilauksenLahjakortit(tilaus.id);
    if (!lahjakortit.length) {
      try { await toimitaLahjakortit(tilaus); } catch (e) { console.error("lahjakortit:", e?.message || e); }
      lahjakortit = await tilauksenLahjakortit(tilaus.id);
    }
  }
  // Kiitos- ja ystäväkoodi (api/_lib/uusintaosto.js) maksetulle tilaukselle kiitossivulle.
  let asiakaskoodit = {};
  if (tilaus.status === "maksettu") {
    try {
      const { tilauksenAsiakaskoodit } = await import("./_lib/uusintaosto.js");
      asiakaskoodit = await tilauksenAsiakaskoodit(sql(), tilaus);
    } catch (e) { console.error("asiakaskoodit:", e?.message || e); }
  }
  if (req.method === "GET" && req.query.lahjakortti) {
    const koodi = normalisoiKoodi(req.query.lahjakortti);
    const kortti = lahjakortit.find((k) => k.code === koodi);
    if (!kortti) return res.status(404).json({ error: "Lahjakorttia ei löytynyt" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfTiedostonimi(kortti.code)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(lahjakorttiPdf(kortti));
  }
  if (req.method === "POST" && req.body?.action === "resend") {
    const viimeksi = tilaus.confirmation_email_sent_at ? new Date(tilaus.confirmation_email_sent_at).getTime() : 0;
    if (Date.now() - viimeksi < 10 * 60 * 1000) return res.status(200).json({ customerEmailSent: true, recently: true });
    const r = await laheta({ to: tilaus.customer_email, ...vahvistusViesti(tilaus) });
    if (r.ok) await sql()`update orders set confirmation_email_sent_at = now() where id = ${tilaus.id}`;
    return res.status(200).json({ customerEmailSent: r.ok });
  }
  return res.status(200).json(vastaus(tilaus, asiakaskoodit, lahjakortit));
}

/** Puskuritilauksen vastaus ja vahvistuksen uudelleenlähetys (ei lahjakortteja eikä asiakaskoodeja ilman kantaa). */
async function vastaaPuskurista(req, res, tilaus) {
  if (req.method === "POST" && req.body?.action === "resend") {
    const viimeksi = tilaus.confirmation_email_sent_at ? new Date(tilaus.confirmation_email_sent_at).getTime() : 0;
    if (Date.now() - viimeksi < 10 * 60 * 1000) return res.status(200).json({ customerEmailSent: true, recently: true });
    const r = await laheta({ to: tilaus.customer_email, ...vahvistusViesti(tilaus) });
    if (r.ok) await blobTilausVarasto().paivita(tilaus.id, { confirmation_email_sent_at: new Date() });
    return res.status(200).json({ customerEmailSent: r.ok });
  }
  return res.status(200).json(vastaus(tilaus, {}, []));
}

function vastaus(tilaus, asiakaskoodit, lahjakortit) {
  return {
    found: true,
    order: {
      id: tilaus.id,
      items: (tilaus.items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.unit_price, size: i.size, color: i.color, slug: i.slug, product_id: i.product_id })),
      total: Number(tilaus.total),
      // GA4 purchase: toimitus ja Stripen veloittama summa palvelimelta (ei selaimen ostoskorista)
      shipping: Number(tilaus.shipping) || 0,
      amount_paid: tilaus.amount_paid == null ? null : Number(tilaus.amount_paid),
      status: tilaus.status === "maksettu" ? "paid" : tilaus.status,
      created_at: tilaus.created_at,
      customer_email: tilaus.customer_email,
      shipping_country: tilaus.shipping_address?.country ?? "FI",
    },
    emailSent: !!tilaus.confirmation_email_sent_at,
    koodit: {
      kiitos: asiakaskoodit.kiitos ? { koodi: asiakaskoodit.kiitos.koodi, prosentti: Number(asiakaskoodit.kiitos.prosentti), voimassa: asiakaskoodit.kiitos.voimassa } : null,
      ystava: asiakaskoodit.ystava ? { koodi: asiakaskoodit.ystava.koodi, linkki: `https://huumorikauppa.fi/ystava/${asiakaskoodit.ystava.koodi}` } : null,
    },
    lahjakortit: lahjakortit.map((k) => ({
      code: k.code, value: Number(k.initial_value), expires_at: k.expires_at,
      recipient_name: k.recipient_name || null, recipient_email: k.recipient_email || null,
    })),
  };
}

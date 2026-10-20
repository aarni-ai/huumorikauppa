/**
 * POST /api/checkout (korvaa Lovable Cloudin create-checkout-funktion). Sama pyyntö kuin ennen:
 * { items, customerEmail, customerName, shippingAddress {address, zip, city, phone}, recipientName, discountCode }.
 * Luo tilausrivin (odottaa_maksua) ja Stripe Checkout -session, jonka metadataan menee vain tilauksen id.
 * Vastaus { ok, url } tai { ok: false, error }. Ilman STRIPE_SECRET_KEY:tä ja DATABASE_URL:ia 503.
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "./_lib/db.js";
import { onStripe, stripe } from "./_lib/stripe.js";
import { kaikkiTuotteet } from "./_lib/tuotteet.js";
import { laskeTilaus, KassaVirhe, OLETUSKOODIT } from "./_lib/kassa.js";

async function alennus(koodi) {
  if (!koodi) return null;
  const k = String(koodi).trim().toUpperCase();
  if (onTietokanta()) {
    const [r] = await sql()`select discount_type, discount_value, is_active from discount_codes where upper(code) = ${k}`;
    if (r) return r.is_active ? { type: r.discount_type, value: Number(r.discount_value) } : null;
  }
  return OLETUSKOODIT[k] ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST" });
  if (!onStripe() || !onTietokanta()) {
    return res.status(503).json({ ok: false, error: "Kassa ei ole vielä käytössä tässä ympäristössä.", diagnostics: { error_stage: "not_configured" } });
  }
  const pyynto = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  let tilausId = null;
  try {
    const laskettu = laskeTilaus(pyynto, await kaikkiTuotteet(), await alennus(pyynto.discountCode));
    const osoite = { ...pyynto.shippingAddress, country: "FI" };
    const [tilaus] = await sql()`insert into orders (customer_email, customer_name, recipient_name, phone, shipping_address,
        items, subtotal, shipping, discount_code, discount, total)
      values (${pyynto.customerEmail.trim()}, ${pyynto.customerName || null}, ${pyynto.recipientName?.trim()?.slice(0, 200) || null},
        ${pyynto.shippingAddress.phone || null}, ${sql().json(osoite)},
        ${sql().json(laskettu.rivit.map(({ unit_cents, ...r }) => r))}, ${laskettu.subtotal}, ${laskettu.shipping},
        ${pyynto.discountCode ? String(pyynto.discountCode).toUpperCase() : null}, ${laskettu.discount}, ${laskettu.total})
      returning id`;
    tilausId = tilaus.id;
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const lineItems = laskettu.rivit.map((r) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: r.name,
          ...([r.size && `Koko: ${r.size}`, r.color && `Väri: ${r.color}`, r.custom_text && `Oma teksti: "${r.custom_text}"`].filter(Boolean).length
            ? { description: [r.size && `Koko: ${r.size}`, r.color && `Väri: ${r.color}`, r.custom_text && `Oma teksti: "${r.custom_text}"`].filter(Boolean).join(" | ") }
            : {}),
          ...(r.image ? { images: [r.image] } : {}),
        },
        unit_amount: r.unit_cents,
      },
      quantity: r.quantity,
    }));
    if (laskettu.shipping > 0) {
      lineItems.push({ price_data: { currency: "eur", product_data: { name: "Toimitus – Posti kotiinkuljetus" }, unit_amount: Math.round(laskettu.shipping * 100) }, quantity: 1 });
    }
    const session = await stripe().checkout.sessions.create({
      customer_email: pyynto.customerEmail.trim(),
      client_reference_id: tilaus.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/tilaus-vahvistettu?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kassa`,
      metadata: { order_id: tilaus.id },
      payment_intent_data: { metadata: { order_id: tilaus.id } },
      locale: "fi",
    });
    await sql()`update orders set stripe_session_id = ${session.id} where id = ${tilaus.id}`;
    await kirjaaTapahtuma(tilaus.id, "kassa", { session: session.id, total: laskettu.total });
    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    if (e instanceof KassaVirhe) return res.status(200).json({ ok: false, error: e.message, diagnostics: { error_stage: e.vaihe } });
    console.error("checkout:", e?.message || e);
    if (tilausId) await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${tilausId} and status = 'odottaa_maksua'`.catch(() => {});
    return res.status(200).json({ ok: false, error: "Maksun aloitus epäonnistui. Yritä hetken kuluttua uudelleen.", diagnostics: { error_stage: "stripe_checkout_create" } });
  }
}

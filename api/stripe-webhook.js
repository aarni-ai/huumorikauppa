/**
 * POST /api/stripe-webhook (Stripe: Developers > Webhooks, tapahtumat checkout.session.completed,
 * checkout.session.async_payment_succeeded, checkout.session.expired). Allekirjoitus STRIPE_WEBHOOK_SECRET.
 * Käsittely on idempotentti (scripts ja cron käyttävät samaa api/_lib/tilaus.js kasitteleMaksu).
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "./_lib/db.js";
import { onStripe, stripe } from "./_lib/stripe.js";
import { kasitteleMaksu, kasitteleLasku } from "./_lib/tilaus.js";

export const config = { api: { bodyParser: false } };

async function raaka(req) {
  const osat = [];
  for await (const osa of req) osat.push(typeof osa === "string" ? Buffer.from(osa) : osa);
  return Buffer.concat(osat);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST");
  if (!onStripe() || !process.env.STRIPE_WEBHOOK_SECRET || !onTietokanta()) return res.status(503).send("ei käytössä");
  let tapahtuma;
  try {
    tapahtuma = stripe().webhooks.constructEvent(await raaka(req), req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Allekirjoitus: ${e.message}`);
  }
  try {
    const session = tapahtuma.data.object;
    if (tapahtuma.type === "checkout.session.completed" || tapahtuma.type === "checkout.session.async_payment_succeeded") {
      await kasitteleMaksu(session);
    } else if (tapahtuma.type === "invoice.paid" || tapahtuma.type === "invoice.voided" || tapahtuma.type === "invoice.marked_uncollectible") {
      await kasitteleLasku(session);
    } else if (tapahtuma.type === "checkout.session.expired") {
      const id = session.metadata?.order_id || session.client_reference_id;
      if (id) {
        const r = await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${id} and status = 'odottaa_maksua' returning id`;
        if (r.length) await kirjaaTapahtuma(id, "peruttu", { syy: "session vanheni" });
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    // 500: Stripe yrittää uudelleen, ja tunnin cron paikkaa myös.
    console.error("stripe-webhook:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

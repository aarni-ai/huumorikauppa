/**
 * GET /api/order?session_id=... tilausvahvistussivulle (korvaa get-order-by-session). Jos webhook ei ole vielä
 * käsitellyt maksua, käsittelee sen tässä (sama idempotentti funktio).
 * POST /api/order { sessionId, action: "resend" } lähettää vahvistuksen uudelleen (enintään 10 min välein).
 */
import { onTietokanta, sql } from "./_lib/db.js";
import { onStripe, stripe } from "./_lib/stripe.js";
import { kasitteleMaksu } from "./_lib/tilaus.js";
import { laheta, vahvistusViesti } from "./_lib/sahkoposti.js";

const haeTilaus = async (sessionId) => (await sql()`select * from orders where stripe_session_id = ${sessionId}`)[0];

export default async function handler(req, res) {
  if (!onTietokanta()) return res.status(200).json({ found: false, syy: "ei käytössä" });
  const sessionId = req.method === "GET" ? req.query.session_id : req.body?.sessionId;
  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return res.status(400).json({ error: "session_id puuttuu" });
  let tilaus = await haeTilaus(sessionId);
  if ((!tilaus || tilaus.status === "odottaa_maksua") && onStripe()) {
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
  if (req.method === "POST" && req.body?.action === "resend") {
    const viimeksi = tilaus.confirmation_email_sent_at ? new Date(tilaus.confirmation_email_sent_at).getTime() : 0;
    if (Date.now() - viimeksi < 10 * 60 * 1000) return res.status(200).json({ customerEmailSent: true, recently: true });
    const r = await laheta({ to: tilaus.customer_email, ...vahvistusViesti(tilaus) });
    if (r.ok) await sql()`update orders set confirmation_email_sent_at = now() where id = ${tilaus.id}`;
    return res.status(200).json({ customerEmailSent: r.ok });
  }
  return res.status(200).json({
    found: true,
    order: {
      id: tilaus.id,
      items: (tilaus.items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.unit_price, size: i.size, color: i.color })),
      total: Number(tilaus.total),
      status: tilaus.status === "maksettu" ? "paid" : tilaus.status,
      created_at: tilaus.created_at,
      customer_email: tilaus.customer_email,
      shipping_country: tilaus.shipping_address?.country ?? "FI",
    },
    emailSent: !!tilaus.confirmation_email_sent_at,
  });
}

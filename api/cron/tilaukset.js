/**
 * Vercel Cron, tunnin välein (vercel.json). Authorization: Bearer CRON_SECRET (Vercel lähettää sen itse).
 *  1. Paikkaus: Stripen maksetut sessiot 72 h ajalta, joita ei ole merkitty maksetuiksi (webhook jäi tulematta).
 *  2. Uudelleenyritys: maksetut tilaukset, joita ei ole saatu Printifyn tuotantoon (ei_lahetetty, luotu, virhe).
 *  2b. Lahjakortit: maksetut tilaukset, joiden lahjakortteja ei ole luotu tai lähetetty, tai joiden lahjakorttiosuutta
 *     ei ole veloitettu kortilta.
 *  3. Seuranta: tuotannossa olevien Printify-tila; lähetyksestä seurantakoodi ja viesti asiakkaalle.
 *     Printifyn on-hold tai has-issues tuotannossa olevalla tilauksella: hälytys omistajalle.
 *  4. Päivän yhteenveto omistajalle kerran päivässä klo 7 Suomen aikaa (jumissa olevat mukana).
 * ?kuiva=1 listaa vain, mitä tehtäisiin.
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "../_lib/db.js";
import { onStripe, stripe } from "../_lib/stripe.js";
import { kasitteleMaksu, lahetaPrintifyyn, halytetaanko } from "../_lib/tilaus.js";
import { haeTilaus, lahetys, onPrintify } from "../_lib/printify.js";
import { laheta, lahetysViesti, halytys, tilausnumero, OMISTAJA } from "../_lib/sahkoposti.js";
import { toimitaLahjakortit, veloitaLahjakortti } from "../_lib/lahjakortti-db.js";

const helsinki = (d = new Date()) => {
  const o = Object.fromEntries(new Intl.DateTimeFormat("fi-FI", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d).map((p) => [p.type, p.value]));
  return { paiva: `${o.year}-${o.month}-${o.day}`, tunti: Number(o.hour) };
};

export default async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: "ei oikeutta" });
  if (!onTietokanta()) return res.status(503).json({ error: "DATABASE_URL puuttuu" });
  const kuiva = req.query.kuiva === "1";
  const loki = [];
  const db = sql();

  // 1. Paikkaus Stripestä
  if (onStripe()) {
    const alku = Math.floor(Date.now() / 1000) - 72 * 3600;
    for await (const s of stripe().checkout.sessions.list({ created: { gte: alku }, status: "complete", limit: 100 })) {
      if (s.payment_status !== "paid") continue;
      const id = s.metadata?.order_id || s.client_reference_id;
      const [t] = id ? await db`select status from orders where id = ${id}` : [];
      if (t?.status === "maksettu") continue;
      loki.push(`paikkaus ${s.id}`);
      if (!kuiva) await kasitteleMaksu(s);
    }
  }

  // 2. Printify-uudelleenyritykset
  const yritettavat = await db`select id from orders where status = 'maksettu'
    and printify_status in ('ei_lahetetty', 'luotu', 'virhe') and (next_retry_at is null or next_retry_at <= now())
    order by paid_at limit 20`;
  for (const { id } of yritettavat) {
    if (kuiva) { loki.push(`yritys ${id}`); continue; }
    const r = await lahetaPrintifyyn(id);
    loki.push(`yritys #${tilausnumero(id)}: ${r.ok ? "tuotannossa" : `${r.vaihe}: ${r.viesti}`}`);
  }

  // 2b. Lahjakortit
  const kortitTekematta = await db`select o.* from orders o where o.status = 'maksettu' and o.paid_at > now() - interval '30 days'
    and (
      (select coalesce(sum((e->>'quantity')::int), 0) from jsonb_array_elements(o.items) e where e->>'type' = 'giftcard')
        > (select count(*) from gift_cards g where g.order_id = o.id)
      or exists (select 1 from gift_cards g where g.order_id = o.id and g.emailed_at is null)
      or (o.gift_card_code is not null and o.gift_card_amount > 0 and o.gift_card_charged_at is null
        and not exists (select 1 from order_events v where v.order_id = o.id and v.kind = 'lahjakortti_saldo_ei_riita'))
    )
    order by o.paid_at limit 20`;
  for (const t of kortitTekematta) {
    loki.push(`lahjakortit #${tilausnumero(t.id)}`);
    if (kuiva) continue;
    if (t.gift_card_code && !t.gift_card_charged_at) await veloitaLahjakortti(t);
    await toimitaLahjakortit(t);
  }

  // 3. Seuranta
  if (onPrintify()) {
    const tuotannossa = await db`select * from orders where status = 'maksettu' and printify_status = 'tuotannossa' order by sent_to_production_at limit 40`;
    for (const t of tuotannossa) {
      const r = await haeTilaus(t.printify_order_id);
      if (!r.ok) { loki.push(`seuranta #${tilausnumero(t.id)}: ${r.virhe}`); continue; }
      const l = lahetys(r.data);
      if (l && (l.numero || l.url)) {
        loki.push(`lähetetty #${tilausnumero(t.id)}`);
        if (kuiva) continue;
        await db`update orders set printify_status = 'lahetetty', carrier = ${l.carrier}, tracking_number = ${l.numero},
          tracking_url = ${l.url}, shipped_at = now(), updated_at = now() where id = ${t.id}`;
        await kirjaaTapahtuma(t.id, "lahetetty", l);
        const p = await laheta({ to: t.customer_email, ...lahetysViesti({ ...t, carrier: l.carrier, tracking_number: l.numero, tracking_url: l.url }) });
        if (p.ok) await db`update orders set shipping_email_sent_at = now() where id = ${t.id}`;
      } else if (["on-hold", "has-issues", "canceled"].includes(r.data?.status) && halytetaanko(t) && !kuiva) {
        await db`update orders set alert_sent_at = now() where id = ${t.id}`;
        await halytys(`Printify-tilaus #${tilausnumero(t.id)} tilassa ${r.data.status}`, [`Printify ${t.printify_order_id}`, `Asiakas ${t.customer_email}`, "Tarkista Printifyn hallinnasta (maksutapa, osoite, tuote)."]);
        loki.push(`hälytys #${tilausnumero(t.id)} ${r.data.status}`);
      }
    }
  }

  // 4. Päivän yhteenveto
  const h = helsinki();
  if (h.tunti >= 7) {
    const [kv] = await db`select value from kv where key = 'yhteenveto_pvm'`;
    if (kv?.value !== h.paiva) {
      const [m] = await db`select
          count(*) filter (where status = 'maksettu' and paid_at > now() - interval '24 hours') as uudet,
          coalesce(sum(amount_paid) filter (where status = 'maksettu' and paid_at > now() - interval '24 hours'), 0) as myynti,
          count(*) filter (where status = 'maksettu' and printify_status in ('ei_lahetetty', 'luotu', 'virhe')) as jumissa,
          count(*) filter (where status = 'maksettu' and printify_status = 'tuotannossa' and sent_to_production_at < now() - interval '10 days') as hidas
        from orders`;
      const jumissa = await db`select id, customer_email, printify_status, printify_error from orders
        where status = 'maksettu' and printify_status in ('ei_lahetetty', 'luotu', 'virhe') order by paid_at limit 20`;
      const rivit = [
        `Uudet maksetut 24 h: ${m.uudet} (${Number(m.myynti).toFixed(2)} €)`,
        `Jumissa ennen tuotantoa: ${m.jumissa}`,
        `Tuotannossa yli 10 pv ilman lähetystä: ${m.hidas}`,
        ...jumissa.map((t) => `#${tilausnumero(t.id)} ${t.customer_email}: ${t.printify_status}, ${t.printify_error || ""}`),
      ];
      loki.push("yhteenveto");
      if (!kuiva) {
        await laheta({ to: OMISTAJA(), subject: `[Huumorikauppa] Päivän yhteenveto ${h.paiva}`, html: `<pre>${rivit.join("\n")}</pre>`, text: rivit.join("\n") });
        await db`insert into kv (key, value) values ('yhteenveto_pvm', ${h.paiva}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
      }
    }
  }
  return res.status(200).json({ ok: true, kuiva, loki });
}
